import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { DisplayMode } from '@microsoft/sp-core-library';
import {
  Stack,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  IColumn,
  CommandBar,
  ICommandBarItemProps,
  SearchBox,
  Dropdown,
  IDropdownOption,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  TextField,
  DatePicker,
  PrimaryButton,
  DefaultButton,
  Label
} from '@fluentui/react';
import { IJMLTask, TaskStatus, TaskCategory } from '../../../models/IJMLTask';
import { JMLService } from '../../../services/JMLService';
import { PnPService } from '../../../services/PnPService';

export interface ITaskManagementProps {
  description: string;
  context: WebPartContext;
  defaultView: string;
  showCompletedTasks: boolean;
  refreshInterval: number;
  jmlService: JMLService;
  pnpService: PnPService;
  displayMode: DisplayMode;
  updateProperty: (value: string) => void;
}

export interface ITaskManagementState {
  tasks: IJMLTask[];
  filteredTasks: IJMLTask[];
  loading: boolean;
  error: string | null;
  selectedTask: IJMLTask | null;
  isTaskPanelOpen: boolean;
  currentView: string;
  searchQuery: string;
  filterCategory: string;
  filterStatus: string;
}

const taskStatusOptions: IDropdownOption[] = [
  { key: '', text: 'All Statuses' },
  { key: TaskStatus.NotStarted, text: 'Not Started' },
  { key: TaskStatus.InProgress, text: 'In Progress' },
  { key: TaskStatus.Completed, text: 'Completed' },
  { key: TaskStatus.Blocked, text: 'Blocked' },
  { key: TaskStatus.Cancelled, text: 'Cancelled' }
];

const taskCategoryOptions: IDropdownOption[] = [
  { key: '', text: 'All Categories' },
  { key: TaskCategory.HR, text: 'HR' },
  { key: TaskCategory.IT, text: 'IT' },
  { key: TaskCategory.Facilities, text: 'Facilities' },
  { key: TaskCategory.Finance, text: 'Finance' },
  { key: TaskCategory.Manager, text: 'Manager' },
  { key: TaskCategory.Employee, text: 'Employee' }
];

export default class TaskManagement extends React.Component<ITaskManagementProps, ITaskManagementState> {
  private refreshTimer: number | undefined;
  private selection: Selection;

  constructor(props: ITaskManagementProps) {
    super(props);

    this.selection = new Selection({
      onSelectionChanged: () => {
        const selected = this.selection.getSelection()[0] as IJMLTask;
        this.setState({ selectedTask: selected || null });
      }
    });

    this.state = {
      tasks: [],
      filteredTasks: [],
      loading: true,
      error: null,
      selectedTask: null,
      isTaskPanelOpen: false,
      currentView: props.defaultView,
      searchQuery: '',
      filterCategory: '',
      filterStatus: ''
    };
  }

  public componentDidMount(): void {
    this.loadTasks();

    if (this.props.refreshInterval > 0) {
      this.refreshTimer = window.setInterval(() => {
        this.loadTasks();
      }, this.props.refreshInterval * 1000);
    }
  }

  public componentWillUnmount(): void {
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      this.setState({ loading: true, error: null });

      let tasks: IJMLTask[] = [];
      const currentUser = await this.props.pnpService.getCurrentUser();

      switch (this.state.currentView) {
        case 'myTasks':
          tasks = await this.loadMyTasks(currentUser.Id);
          break;
        case 'allTasks':
          tasks = await this.loadAllTasks();
          break;
        case 'overdue':
          tasks = await this.loadOverdueTasks();
          break;
        case 'hr':
          tasks = await this.loadTasksByCategory(TaskCategory.HR);
          break;
        case 'it':
          tasks = await this.loadTasksByCategory(TaskCategory.IT);
          break;
        default:
          tasks = await this.loadMyTasks(currentUser.Id);
      }

      this.setState({
        tasks,
        filteredTasks: this.applyFilters(tasks),
        loading: false
      });
    } catch (error) {
      this.setState({
        error: (error as Error).message || 'Failed to load tasks',
        loading: false
      });
    }
  }

  private async loadMyTasks(userId: number): Promise<IJMLTask[]> {
    const filter = `JMLTaskAssignedTo/Id eq ${userId} and JMLTaskStatus ne '${TaskStatus.Completed}'`;
    return await this.props.pnpService.getListItems<IJMLTask>('JML Tasks', undefined, filter);
  }

  private async loadAllTasks(): Promise<IJMLTask[]> {
    const filter = this.props.showCompletedTasks ? undefined : `JMLTaskStatus ne '${TaskStatus.Completed}'`;
    return await this.props.pnpService.getListItems<IJMLTask>('JML Tasks', undefined, filter);
  }

  private async loadOverdueTasks(): Promise<IJMLTask[]> {
    const today = new Date().toISOString().split('T')[0];
    const filter = `JMLTaskDueDate lt datetime'${today}' and JMLTaskStatus ne '${TaskStatus.Completed}'`;
    return await this.props.pnpService.getListItems<IJMLTask>('JML Tasks', undefined, filter);
  }

  private async loadTasksByCategory(category: TaskCategory): Promise<IJMLTask[]> {
    const filter = `JMLTaskCategory eq '${category}' and JMLTaskStatus ne '${TaskStatus.Completed}'`;
    return await this.props.pnpService.getListItems<IJMLTask>('JML Tasks', undefined, filter);
  }

  private applyFilters(tasks: IJMLTask[]): IJMLTask[] {
    let filtered = [...tasks];

    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.taskDescription?.toLowerCase().includes(query)
      );
    }

    if (this.state.filterCategory) {
      filtered = filtered.filter(t => t.taskCategory === this.state.filterCategory);
    }

    if (this.state.filterStatus) {
      filtered = filtered.filter(t => t.taskStatus === this.state.filterStatus);
    }

    return filtered;
  }

  private handleSearch = (query: string): void => {
    this.setState({ searchQuery: query }, () => {
      this.setState({ filteredTasks: this.applyFilters(this.state.tasks) });
    });
  };

  private handleCategoryFilter = (_: any, option?: IDropdownOption): void => {
    this.setState({ filterCategory: option?.key as string }, () => {
      this.setState({ filteredTasks: this.applyFilters(this.state.tasks) });
    });
  };

  private handleStatusFilter = (_: any, option?: IDropdownOption): void => {
    this.setState({ filterStatus: option?.key as string }, () => {
      this.setState({ filteredTasks: this.applyFilters(this.state.tasks) });
    });
  };

  private handleViewChange = (view: string): void => {
    this.setState({ currentView: view }, () => this.loadTasks());
  };

  private handleUpdateTaskStatus = async (task: IJMLTask, newStatus: TaskStatus): Promise<void> => {
    try {
      await this.props.pnpService.updateListItem('JML Tasks', task.Id!, {
        JMLTaskStatus: newStatus,
        JMLTaskCompletedDate: newStatus === TaskStatus.Completed ? new Date().toISOString() : null
      });
      await this.loadTasks();
    } catch (error) {
      this.setState({ error: (error as Error).message });
    }
  };

  private getColumns(): IColumn[] {
    return [
      {
        key: 'title',
        name: 'Task',
        fieldName: 'title',
        minWidth: 200,
        maxWidth: 300,
        isResizable: true
      },
      {
        key: 'category',
        name: 'Category',
        fieldName: 'taskCategory',
        minWidth: 80,
        maxWidth: 100,
        isResizable: true
      },
      {
        key: 'status',
        name: 'Status',
        fieldName: 'taskStatus',
        minWidth: 100,
        maxWidth: 120,
        isResizable: true
      },
      {
        key: 'assignedTo',
        name: 'Assigned To',
        fieldName: 'assignedTo',
        minWidth: 150,
        maxWidth: 200,
        isResizable: true,
        onRender: (item: IJMLTask) => item.assignedTo?.title || 'Unassigned'
      },
      {
        key: 'dueDate',
        name: 'Due Date',
        fieldName: 'dueDate',
        minWidth: 100,
        maxWidth: 120,
        isResizable: true,
        onRender: (item: IJMLTask) => item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'
      },
      {
        key: 'priority',
        name: 'Priority',
        fieldName: 'priority',
        minWidth: 80,
        maxWidth: 100,
        isResizable: true
      }
    ];
  }

  private getCommandBarItems(): ICommandBarItemProps[] {
    return [
      {
        key: 'refresh',
        text: 'Refresh',
        iconProps: { iconName: 'Refresh' },
        onClick: () => this.loadTasks()
      },
      {
        key: 'myTasks',
        text: 'My Tasks',
        iconProps: { iconName: 'Contact' },
        onClick: () => this.handleViewChange('myTasks')
      },
      {
        key: 'allTasks',
        text: 'All Tasks',
        iconProps: { iconName: 'BulletedList' },
        onClick: () => this.handleViewChange('allTasks')
      },
      {
        key: 'overdue',
        text: 'Overdue',
        iconProps: { iconName: 'Warning' },
        onClick: () => this.handleViewChange('overdue')
      }
    ];
  }

  public render(): React.ReactElement<ITaskManagementProps> {
    const { loading, error, filteredTasks } = this.state;

    return (
      <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
        <h2>Task Management</h2>

        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => this.setState({ error: null })}>
            {error}
          </MessageBar>
        )}

        <CommandBar items={this.getCommandBarItems()} />

        <Stack horizontal tokens={{ childrenGap: 15 }}>
          <SearchBox
            placeholder="Search tasks..."
            onSearch={this.handleSearch}
            onClear={() => this.handleSearch('')}
            styles={{ root: { width: 300 } }}
          />
          <Dropdown
            placeholder="Filter by category"
            options={taskCategoryOptions}
            onChange={this.handleCategoryFilter}
            styles={{ root: { width: 200 } }}
          />
          <Dropdown
            placeholder="Filter by status"
            options={taskStatusOptions}
            onChange={this.handleStatusFilter}
            styles={{ root: { width: 200 } }}
          />
        </Stack>

        {loading ? (
          <Spinner size={SpinnerSize.large} label="Loading tasks..." />
        ) : (
          <DetailsList
            items={filteredTasks}
            columns={this.getColumns()}
            selection={this.selection}
            selectionMode={SelectionMode.single}
            layoutMode={DetailsListLayoutMode.justified}
            isHeaderVisible={true}
          />
        )}
      </Stack>
    );
  }
}
