import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'JmlDashboardWebPartStrings';
import JmlDashboard from './components/JmlDashboard';
import { IJmlDashboardProps } from './components/IJmlDashboardProps';
import { PnPService } from '../../services/PnPService';
import { GraphService } from '../../services/GraphService';
import { JMLService } from '../../services/JMLService';

export interface IJmlDashboardWebPartProps {
  description: string;
  showCharts: boolean;
  refreshInterval: number;
}

export default class JmlDashboardWebPart extends BaseClientSideWebPart<IJmlDashboardWebPartProps> {
  private pnpService: PnPService;
  private graphService: GraphService;
  private jmlService: JMLService;

  protected async onInit(): Promise<void> {
    await super.onInit();

    // Initialize services
    this.pnpService = new PnPService(this.context);

    // Initialize Graph service
    const graphClient = await this.context.msGraphClientFactory.getClient('3');
    this.graphService = new GraphService(graphClient);

    // Initialize JML service
    this.jmlService = new JMLService(this.pnpService, this.graphService);
  }

  public render(): void {
    const element: React.ReactElement<IJmlDashboardProps> = React.createElement(
      JmlDashboard,
      {
        description: this.properties.description,
        context: this.context,
        showCharts: this.properties.showCharts,
        refreshInterval: this.properties.refreshInterval,
        jmlService: this.jmlService,
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
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneToggle('showCharts', {
                  label: 'Show Charts',
                  onText: 'Yes',
                  offText: 'No'
                }),
                PropertyPaneSlider('refreshInterval', {
                  label: 'Auto Refresh Interval (seconds)',
                  min: 30,
                  max: 300,
                  step: 30,
                  showValue: true
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
