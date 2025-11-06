import { WebPartContext } from '@microsoft/sp-webpart-base';
import { DisplayMode } from '@microsoft/sp-core-library';
import { JMLService } from '../../../services/JMLService';

export interface IJmlDashboardProps {
  description: string;
  context: WebPartContext;
  showCharts: boolean;
  refreshInterval: number;
  jmlService: JMLService;
  displayMode: DisplayMode;
  updateProperty: (value: string) => void;
}
