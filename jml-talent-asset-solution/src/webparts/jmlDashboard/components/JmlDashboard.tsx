import * as React from 'react';
import { IJmlDashboardProps } from './IJmlDashboardProps';
import { IJMLProcess, ProcessStatus } from '../../../models';
import {
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  DefaultButton,
  PrimaryButton,
  Card
} from '@fluentui/react';

export interface IJmlDashboardState {
  activeProcesses: IJMLProcess[];
  loading: boolean;
  error: string | null;
  metrics: {
    totalActive: number;
    onboarding: number;
    transfers: number;
    offboarding: number;
    overdueTasks: number;
  };
}

export default class JmlDashboard extends React.Component<IJmlDashboardProps, IJmlDashboardState> {
  private refreshTimer: number | undefined;

  constructor(props: IJmlDashboardProps) {
    super(props);

    this.state = {
      activeProcesses: [],
      loading: true,
      error: null,
      metrics: {
        totalActive: 0,
        onboarding: 0,
        transfers: 0,
        offboarding: 0,
        overdueTasks: 0
      }
    };
  }

  public componentDidMount(): void {
    this.loadData();

    // Setup auto-refresh
    if (this.props.refreshInterval > 0) {
      this.refreshTimer = window.setInterval(() => {
        this.loadData();
      }, this.props.refreshInterval * 1000);
    }
  }

  public componentWillUnmount(): void {
    if (this.refreshTimer) {
      window.clearInterval(this.refreshTimer);
    }
  }

  private async loadData(): Promise<void> {
    try {
      this.setState({ loading: true, error: null });

      const processes = await this.props.jmlService.getActiveProcesses();

      const metrics = {
        totalActive: processes.length,
        onboarding: processes.filter(p => p.processType === 'Onboarding').length,
        transfers: processes.filter(p => p.processType === 'Transfer').length,
        offboarding: processes.filter(p => p.processType === 'Offboarding').length,
        overdueTasks: 0 // TODO: Calculate from tasks
      };

      this.setState({
        activeProcesses: processes,
        metrics,
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.setState({
        error: (error as Error).message || 'Failed to load dashboard data',
        loading: false
      });
    }
  }

  private handleRefresh = (): void => {
    this.loadData();
  };

  public render(): React.ReactElement<IJmlDashboardProps> {
    const { description, showCharts } = this.props;
    const { loading, error, metrics, activeProcesses } = this.state;

    return (
      <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
        {/* Header */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>
            JML Dashboard
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }}>
            <DefaultButton
              text="Refresh"
              iconProps={{ iconName: 'Refresh' }}
              onClick={this.handleRefresh}
              disabled={loading}
            />
            <PrimaryButton
              text="New Process"
              iconProps={{ iconName: 'Add' }}
              onClick={() => alert('Create new process (not implemented)')}
            />
          </Stack>
        </Stack>

        {description && (
          <Text variant="medium">{description}</Text>
        )}

        {/* Error Message */}
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => this.setState({ error: null })}>
            {error}
          </MessageBar>
        )}

        {/* Loading Spinner */}
        {loading && (
          <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
            <Spinner size={SpinnerSize.large} label="Loading dashboard..." />
          </Stack>
        )}

        {/* Metrics Cards */}
        {!loading && (
          <Stack horizontal tokens={{ childrenGap: 20 }} wrap>
            <MetricCard
              title="Total Active Processes"
              value={metrics.totalActive}
              icon="ProcessMetaTask"
              color="#0078D4"
            />
            <MetricCard
              title="Onboarding"
              value={metrics.onboarding}
              icon="AddFriend"
              color="#107C10"
            />
            <MetricCard
              title="Transfers"
              value={metrics.transfers}
              icon="Switch"
              color="#FF8C00"
            />
            <MetricCard
              title="Offboarding"
              value={metrics.offboarding}
              icon="Leave"
              color="#D13438"
            />
          </Stack>
        )}

        {/* Active Processes List */}
        {!loading && activeProcesses.length === 0 && (
          <MessageBar messageBarType={MessageBarType.info}>
            No active JML processes at this time.
          </MessageBar>
        )}

        {!loading && activeProcesses.length > 0 && (
          <Stack tokens={{ childrenGap: 15 }}>
            <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
              Active Processes ({activeProcesses.length})
            </Text>
            {activeProcesses.map(process => (
              <ProcessCard key={process.Id} process={process} />
            ))}
          </Stack>
        )}

        {/* Charts Section (if enabled) */}
        {showCharts && !loading && (
          <Stack tokens={{ childrenGap: 15 }}>
            <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
              Analytics
            </Text>
            <Text variant="medium" styles={{ root: { fontStyle: 'italic', color: '#666' } }}>
              Charts will be implemented in Phase 2
            </Text>
          </Stack>
        )}
      </Stack>
    );
  }
}

/**
 * Metric Card Component
 */
interface IMetricCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const MetricCard: React.FC<IMetricCardProps> = ({ title, value, icon, color }) => {
  return (
    <Stack
      styles={{
        root: {
          minWidth: 200,
          padding: 20,
          border: `2px solid ${color}`,
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      }}
      tokens={{ childrenGap: 10 }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="medium" styles={{ root: { color: '#666' } }}>
          {title}
        </Text>
        <span style={{ fontSize: 24, color }} className={`ms-Icon ms-Icon--${icon}`} />
      </Stack>
      <Text variant="xxLarge" styles={{ root: { fontWeight: 700, color } }}>
        {value}
      </Text>
    </Stack>
  );
};

/**
 * Process Card Component
 */
interface IProcessCardProps {
  process: IJMLProcess;
}

const ProcessCard: React.FC<IProcessCardProps> = ({ process }) => {
  const getStatusColor = (status: ProcessStatus): string => {
    switch (status) {
      case ProcessStatus.Completed: return '#107C10';
      case ProcessStatus.InProgress: return '#0078D4';
      case ProcessStatus.Pending: return '#FF8C00';
      case ProcessStatus.OnHold: return '#D13438';
      case ProcessStatus.Cancelled: return '#666666';
      default: return '#0078D4';
    }
  };

  return (
    <Stack
      styles={{
        root: {
          padding: 15,
          border: '1px solid #EDEBE9',
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          cursor: 'pointer',
          ':hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            borderColor: '#0078D4'
          }
        }
      }}
      tokens={{ childrenGap: 10 }}
    >
      <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
        <Stack tokens={{ childrenGap: 5 }} styles={{ root: { flex: 1 } }}>
          <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              {process.employee.fullName}
            </Text>
            <Stack
              styles={{
                root: {
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: getStatusColor(process.processStatus),
                  color: '#FFFFFF'
                }
              }}
            >
              <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                {process.processType}
              </Text>
            </Stack>
          </Stack>
          <Text variant="medium" styles={{ root: { color: '#666' } }}>
            {process.department} • {process.processId}
          </Text>
          <Text variant="small" styles={{ root: { color: '#999' } }}>
            Target: {new Date(process.targetCompletionDate).toLocaleDateString()}
          </Text>
        </Stack>
        <Stack tokens={{ childrenGap: 5 }} horizontalAlign="end">
          <Text variant="large" styles={{ root: { fontWeight: 700, color: getStatusColor(process.processStatus) } }}>
            {process.overallProgress}%
          </Text>
          <Text variant="small" styles={{ root: { color: '#666' } }}>
            Progress
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
};
