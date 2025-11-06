import { MSGraphClientV3 } from '@microsoft/sp-http';
import { ErrorHandlerService, fetchWithRetry } from './ErrorHandler';

/**
 * Microsoft Graph Service for Entra ID and Microsoft 365 operations
 */
export class GraphService {
  private graphClient: MSGraphClientV3;

  constructor(graphClient: MSGraphClientV3) {
    this.graphClient = graphClient;
  }

  /**
   * Get user profile from Entra ID
   */
  public async getUserProfile(userPrincipalName: string): Promise<any> {
    try {
      const user = await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userPrincipalName}`)
          .select('id,displayName,mail,jobTitle,department,officeLocation,manager')
          .expand('manager')
          .get()
      );

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.mail,
        jobTitle: user.jobTitle,
        department: user.department,
        officeLocation: user.officeLocation,
        manager: user.manager
      };
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.getUserProfile(${userPrincipalName})`);
      throw error;
    }
  }

  /**
   * Get user photo
   */
  public async getUserPhoto(userId: string): Promise<string | null> {
    try {
      const photoBlob = await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}/photo/$value`)
          .responseType('blob')
          .get()
      );

      const url = window.URL.createObjectURL(photoBlob);
      return url;
    } catch (error) {
      // Photo not found is common, don't log as error
      console.warn(`No photo found for user ${userId}`);
      return null;
    }
  }

  /**
   * Create user account (requires admin permissions)
   */
  public async createUser(userDetails: {
    displayName: string;
    mailNickname: string;
    userPrincipalName: string;
    temporaryPassword: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
  }): Promise<string> {
    try {
      const response = await fetchWithRetry(() =>
        this.graphClient
          .api('/users')
          .post({
            accountEnabled: true,
            displayName: userDetails.displayName,
            mailNickname: userDetails.mailNickname,
            userPrincipalName: userDetails.userPrincipalName,
            passwordProfile: {
              forceChangePasswordNextSignIn: true,
              password: userDetails.temporaryPassword
            },
            jobTitle: userDetails.jobTitle,
            department: userDetails.department,
            officeLocation: userDetails.officeLocation
          })
      );

      return response.id;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'GraphService.createUser');
      throw error;
    }
  }

  /**
   * Disable user account
   */
  public async disableUser(userId: string): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}`)
          .patch({
            accountEnabled: false
          })
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.disableUser(${userId})`);
      throw error;
    }
  }

  /**
   * Assign license to user
   */
  public async assignLicense(userId: string, skuId: string): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}/assignLicense`)
          .post({
            addLicenses: [
              {
                disabledPlans: [],
                skuId: skuId
              }
            ],
            removeLicenses: []
          })
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.assignLicense(${userId})`);
      throw error;
    }
  }

  /**
   * Remove license from user
   */
  public async removeLicense(userId: string, skuId: string): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}/assignLicense`)
          .post({
            addLicenses: [],
            removeLicenses: [skuId]
          })
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.removeLicense(${userId})`);
      throw error;
    }
  }

  /**
   * Get user's manager
   */
  public async getUserManager(userId: string): Promise<any | null> {
    try {
      const manager = await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}/manager`)
          .get()
      );

      return {
        id: manager.id,
        displayName: manager.displayName,
        email: manager.mail,
        jobTitle: manager.jobTitle
      };
    } catch (error) {
      // Manager not found is common for executives
      console.warn(`No manager found for user ${userId}`);
      return null;
    }
  }

  /**
   * Get user's direct reports
   */
  public async getUserDirectReports(userId: string): Promise<any[]> {
    try {
      const response = await fetchWithRetry(() =>
        this.graphClient
          .api(`/users/${userId}/directReports`)
          .get()
      );

      return response.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.mail,
        jobTitle: user.jobTitle
      }));
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.getUserDirectReports(${userId})`);
      return [];
    }
  }

  /**
   * Search users
   */
  public async searchUsers(searchTerm: string): Promise<any[]> {
    try {
      const response = await fetchWithRetry(() =>
        this.graphClient
          .api('/users')
          .filter(
            `startswith(displayName,'${searchTerm}') or startswith(mail,'${searchTerm}')`
          )
          .select('id,displayName,mail,jobTitle,department')
          .top(25)
          .get()
      );

      return response.value;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.searchUsers(${searchTerm})`);
      return [];
    }
  }

  /**
   * Add user to group
   */
  public async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/groups/${groupId}/members/$ref`)
          .post({
            '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
          })
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.addUserToGroup(${userId}, ${groupId})`);
      throw error;
    }
  }

  /**
   * Remove user from group
   */
  public async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/groups/${groupId}/members/${userId}/$ref`)
          .delete()
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `GraphService.removeUserFromGroup(${userId}, ${groupId})`);
      throw error;
    }
  }

  /**
   * Send Teams notification (requires Channel.Send permission)
   */
  public async sendTeamsMessage(
    teamId: string,
    channelId: string,
    message: string
  ): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.graphClient
          .api(`/teams/${teamId}/channels/${channelId}/messages`)
          .post({
            body: {
              content: message,
              contentType: 'html'
            }
          })
      );
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'GraphService.sendTeamsMessage');
      throw error;
    }
  }
}
