import * as React from 'react';
import * as ReactDom from 'react';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneDropdown, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import TaskManagement, { ITaskManagementProps } from './components/TaskManagement';
import { PnPService } from '../../services/PnPService';
import { JMLService } from '../../services/JMLService';
import { GraphService } from '../../services/GraphService';

export interface ITaskManagementWebPartProps {
  description: string;
  defaultView: string;
  showCompletedTasks: boolean;
  refreshInterval: number;
}

export default class TaskManagementWebPart extends BaseClientSideWebPart<ITaskManagementWebPartProps> {
  private pnpService: PnPService;
  private graphService: GraphService;
  private jmlService: JMLService;

  protected async onInit(): Promise<void> {
    await super.onInit();

    // Initialize services
    this.pnpService = new PnPService(this.context);
    const graphClient = await this.context.msGraphClientFactory.getClient('3');
    this.graphService = new GraphService(graphClient);
    this.jmlService = new JMLService(this.pnpService, this.graphService);
  }

  public render(): void {
    const element: React.ReactElement<ITaskManagementProps> = React.createElement(
      TaskManagement,
      {
        description: this.properties.description,
        context: this.context,
        defaultView: this.properties.defaultView || 'myTasks',
        showCompletedTasks: this.properties.showCompletedTasks,
        refreshInterval: this.properties.refreshInterval || 0,
        jmlService: this.jmlService,
        pnpService: this.pnpService,
        displayMode: this.displayMode,
        updateProperty: (value: string) => {
          this.properties.description = value;
        }
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Configure the Task Management web part'
          },
          groups: [
            {
              groupName: 'Display Settings',
              groupFields: [
                PropertyPaneTextField('description', {
                  label: 'Web Part Description'
                }),
                PropertyPaneDropdown('defaultView', {
                  label: 'Default View',
                  options: [
                    { key: 'myTasks', text: 'My Tasks' },
                    { key: 'allTasks', text: 'All Tasks' },
                    { key: 'overdue', text: 'Overdue Tasks' },
                    { key: 'hr', text: 'HR Tasks' },
                    { key: 'it', text: 'IT Tasks' }
                  ]
                }),
                PropertyPaneToggle('showCompletedTasks', {
                  label: 'Show Completed Tasks',
                  onText: 'Yes',
                  offText: 'No'
                }),
                PropertyPaneTextField('refreshInterval', {
                  label: 'Auto-refresh interval (seconds, 0 to disable)'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
