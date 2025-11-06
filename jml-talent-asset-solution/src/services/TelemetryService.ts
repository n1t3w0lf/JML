import { ApplicationInsights, IEventTelemetry, IMetricTelemetry, IExceptionTelemetry, SeverityLevel } from '@microsoft/applicationinsights-web';

export enum TelemetryEventType {
  ProcessCreated = 'ProcessCreated',
  ProcessCompleted = 'ProcessCompleted',
  TaskAssigned = 'TaskAssigned',
  TaskCompleted = 'TaskCompleted',
  AssetAssigned = 'AssetAssigned',
  AssetReturned = 'AssetReturned',
  UserLogin = 'UserLogin',
  SearchPerformed = 'SearchPerformed',
  ErrorOccurred = 'ErrorOccurred'
}

export interface ITelemetryEvent {
  name: string;
  properties?: { [key: string]: any };
  measurements?: { [key: string]: number };
}

export interface IPerformanceMetric {
  name: string;
  value: number;
  properties?: { [key: string]: any };
}

/**
 * Telemetry Service for Application Insights integration
 * Tracks user actions, performance metrics, and errors
 */
export class TelemetryService {
  private appInsights: ApplicationInsights | null = null;
  private isInitialized: boolean = false;
  private instrumentationKey: string;
  private enableDebugLogging: boolean;

  constructor(instrumentationKey: string, enableDebugLogging: boolean = false) {
    this.instrumentationKey = instrumentationKey;
    this.enableDebugLogging = enableDebugLogging;
  }

  /**
   * Initialize Application Insights
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    try {
      this.appInsights = new ApplicationInsights({
        config: {
          instrumentationKey: this.instrumentationKey,
          enableAutoRouteTracking: true,
          enableRequestHeaderTracking: true,
          enableResponseHeaderTracking: true,
          enableCorsCorrelation: true,
          correlationHeaderExcludedDomains: ['*.queue.core.windows.net'],
          disableFetchTracking: false,
          enableUnhandledPromiseRejectionTracking: true,
          maxBatchInterval: 5000,
          disableExceptionTracking: false
        }
      });

      this.appInsights.loadAppInsights();
      this.appInsights.trackPageView();
      this.isInitialized = true;

      if (this.enableDebugLogging) {
        console.log('Application Insights initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize Application Insights:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Track custom event
   */
  public trackEvent(eventName: string, properties?: { [key: string]: any }, measurements?: { [key: string]: number }): void {
    if (!this.isInitialized || !this.appInsights) {
      if (this.enableDebugLogging) {
        console.log('Event tracked (debug):', eventName, properties, measurements);
      }
      return;
    }

    const event: IEventTelemetry = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: this.getEnvironment()
      },
      measurements
    };

    this.appInsights.trackEvent(event);

    if (this.enableDebugLogging) {
      console.log('Event tracked:', event);
    }
  }

  /**
   * Track metric
   */
  public trackMetric(name: string, value: number, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) {
      if (this.enableDebugLogging) {
        console.log('Metric tracked (debug):', name, value, properties);
      }
      return;
    }

    const metric: IMetricTelemetry = {
      name,
      average: value,
      sampleCount: 1,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    };

    this.appInsights.trackMetric(metric);

    if (this.enableDebugLogging) {
      console.log('Metric tracked:', metric);
    }
  }

  /**
   * Track exception
   */
  public trackException(error: Error, severityLevel: SeverityLevel = SeverityLevel.Error, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) {
      console.error('Exception (not tracked):', error, properties);
      return;
    }

    const exception: IExceptionTelemetry = {
      exception: error,
      severityLevel,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        stackTrace: error.stack
      }
    };

    this.appInsights.trackException(exception);

    if (this.enableDebugLogging) {
      console.log('Exception tracked:', exception);
    }
  }

  /**
   * Track page view
   */
  public trackPageView(name?: string, uri?: string, properties?: { [key: string]: any }): void {
    if (!this.isInitialized || !this.appInsights) {
      if (this.enableDebugLogging) {
        console.log('Page view tracked (debug):', name, uri);
      }
      return;
    }

    this.appInsights.trackPageView({
      name,
      uri,
      properties
    });
  }

  /**
   * Start tracking a performance timer
   */
  public startTrackingPerformance(operationName: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.trackMetric(`Performance_${operationName}`, duration, {
        operationName,
        unit: 'milliseconds'
      });
    };
  }

  /**
   * Track process-related events
   */
  public trackProcessEvent(eventType: TelemetryEventType, processId: string, processType: string, properties?: { [key: string]: any }): void {
    this.trackEvent(eventType, {
      processId,
      processType,
      ...properties
    });
  }

  /**
   * Track task-related events
   */
  public trackTaskEvent(eventType: TelemetryEventType, taskId: string, taskCategory: string, properties?: { [key: string]: any }): void {
    this.trackEvent(eventType, {
      taskId,
      taskCategory,
      ...properties
    });
  }

  /**
   * Track asset-related events
   */
  public trackAssetEvent(eventType: TelemetryEventType, assetId: string, assetCategory: string, properties?: { [key: string]: any }): void {
    this.trackEvent(eventType, {
      assetId,
      assetCategory,
      ...properties
    });
  }

  /**
   * Track user activity
   */
  public trackUserActivity(activityType: string, userId: number, userEmail: string, properties?: { [key: string]: any }): void {
    this.trackEvent('UserActivity', {
      activityType,
      userId,
      userEmail,
      ...properties
    });
  }

  /**
   * Track search query
   */
  public trackSearch(searchQuery: string, resultCount: number, searchDuration: number): void {
    this.trackEvent(TelemetryEventType.SearchPerformed, {
      searchQuery: searchQuery.toLowerCase(),
      resultCount
    }, {
      durationMs: searchDuration
    });
  }

  /**
   * Track API call performance
   */
  public trackApiCall(apiName: string, duration: number, success: boolean, statusCode?: number): void {
    this.trackMetric(`API_${apiName}_Duration`, duration, {
      success: success.toString(),
      statusCode: statusCode?.toString()
    });

    this.trackEvent('APICall', {
      apiName,
      success: success.toString(),
      statusCode: statusCode?.toString()
    }, {
      durationMs: duration
    });
  }

  /**
   * Track business metrics
   */
  public trackBusinessMetric(metricName: string, value: number, dimensions?: { [key: string]: any }): void {
    this.trackMetric(`Business_${metricName}`, value, dimensions);
  }

  /**
   * Track onboarding completion time
   */
  public trackOnboardingDuration(processId: string, durationDays: number): void {
    this.trackBusinessMetric('OnboardingDuration', durationDays, {
      processId,
      unit: 'days'
    });
  }

  /**
   * Track offboarding completion time
   */
  public trackOffboardingDuration(processId: string, durationDays: number): void {
    this.trackBusinessMetric('OffboardingDuration', durationDays, {
      processId,
      unit: 'days'
    });
  }

  /**
   * Track task completion time
   */
  public trackTaskCompletionTime(taskId: string, durationHours: number): void {
    this.trackBusinessMetric('TaskCompletionTime', durationHours, {
      taskId,
      unit: 'hours'
    });
  }

  /**
   * Set authenticated user context
   */
  public setAuthenticatedUserContext(userId: string, accountId?: string): void {
    if (!this.isInitialized || !this.appInsights) {
      return;
    }

    this.appInsights.setAuthenticatedUserContext(userId, accountId, true);
  }

  /**
   * Clear authenticated user context
   */
  public clearAuthenticatedUserContext(): void {
    if (!this.isInitialized || !this.appInsights) {
      return;
    }

    this.appInsights.clearAuthenticatedUserContext();
  }

  /**
   * Flush telemetry buffer
   */
  public flush(): void {
    if (!this.isInitialized || !this.appInsights) {
      return;
    }

    this.appInsights.flush();
  }

  /**
   * Get current environment
   */
  private getEnvironment(): string {
    const hostname = window.location.hostname;

    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'Development';
    } else if (hostname.includes('test') || hostname.includes('staging')) {
      return 'Staging';
    } else {
      return 'Production';
    }
  }

  /**
   * Get telemetry statistics (for debugging)
   */
  public getStatistics(): any {
    if (!this.isInitialized) {
      return { isInitialized: false };
    }

    return {
      isInitialized: this.isInitialized,
      instrumentationKey: this.instrumentationKey.substring(0, 8) + '...',
      environment: this.getEnvironment(),
      enableDebugLogging: this.enableDebugLogging
    };
  }
}

// Singleton instance
let telemetryServiceInstance: TelemetryService | null = null;

export function getTelemetryService(instrumentationKey?: string, enableDebugLogging?: boolean): TelemetryService {
  if (!telemetryServiceInstance && instrumentationKey) {
    telemetryServiceInstance = new TelemetryService(instrumentationKey, enableDebugLogging);
    telemetryServiceInstance.initialize();
  }

  if (!telemetryServiceInstance) {
    throw new Error('TelemetryService must be initialized with an instrumentation key first');
  }

  return telemetryServiceInstance;
}
