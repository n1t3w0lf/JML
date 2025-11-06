import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp/presets/all';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";
import "@pnp/sp/fields";
import "@pnp/sp/views";
import { ErrorHandlerService, NotFoundError, fetchWithRetry } from './ErrorHandler';

/**
 * PnP Service for SharePoint operations with caching and error handling
 */
export class PnPService {
  private sp: SPFI;
  private context: WebPartContext;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(context: WebPartContext) {
    this.context = context;
    this.sp = spfi().using(SPFx(context));
  }

  /**
   * Get SharePoint context
   */
  public getSP(): SPFI {
    return this.sp;
  }

  /**
   * Get items from a list with caching
   */
  public async getListItems<T>(
    listTitle: string,
    selectFields?: string[],
    filter?: string,
    orderBy?: string,
    top?: number,
    useCache: boolean = true
  ): Promise<T[]> {
    const cacheKey = `list_${listTitle}_${filter}_${orderBy}_${top}`;

    // Check cache
    if (useCache) {
      const cached = this.getFromCache<T[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      let query = this.sp.web.lists.getByTitle(listTitle).items;

      if (selectFields && selectFields.length > 0) {
        query = query.select(...selectFields);
      }

      if (filter) {
        query = query.filter(filter);
      }

      if (orderBy) {
        query = query.orderBy(orderBy, true);
      }

      if (top) {
        query = query.top(top);
      }

      const items = await fetchWithRetry(() => query());

      // Cache the result
      if (useCache) {
        this.setCache(cacheKey, items);
      }

      return items as T[];
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.getListItems(${listTitle})`);
      throw error;
    }
  }

  /**
   * Get a single item by ID
   */
  public async getListItemById<T>(
    listTitle: string,
    itemId: number,
    selectFields?: string[]
  ): Promise<T> {
    try {
      let query = this.sp.web.lists.getByTitle(listTitle).items.getById(itemId);

      if (selectFields && selectFields.length > 0) {
        query = query.select(...selectFields);
      }

      const item = await fetchWithRetry(() => query());

      if (!item) {
        throw new NotFoundError(listTitle, itemId);
      }

      return item as T;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.getListItemById(${listTitle}, ${itemId})`);
      throw error;
    }
  }

  /**
   * Create a new list item
   */
  public async createListItem<T>(
    listTitle: string,
    data: any
  ): Promise<T> {
    try {
      const result = await fetchWithRetry(() =>
        this.sp.web.lists.getByTitle(listTitle).items.add(data)
      );

      // Clear cache for this list
      this.clearCacheByPattern(`list_${listTitle}`);

      return result.data as T;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.createListItem(${listTitle})`);
      throw error;
    }
  }

  /**
   * Update a list item
   */
  public async updateListItem(
    listTitle: string,
    itemId: number,
    data: any
  ): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.sp.web.lists.getByTitle(listTitle).items.getById(itemId).update(data)
      );

      // Clear cache for this list
      this.clearCacheByPattern(`list_${listTitle}`);
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.updateListItem(${listTitle}, ${itemId})`);
      throw error;
    }
  }

  /**
   * Delete a list item
   */
  public async deleteListItem(
    listTitle: string,
    itemId: number
  ): Promise<void> {
    try {
      await fetchWithRetry(() =>
        this.sp.web.lists.getByTitle(listTitle).items.getById(itemId).delete()
      );

      // Clear cache for this list
      this.clearCacheByPattern(`list_${listTitle}`);
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.deleteListItem(${listTitle}, ${itemId})`);
      throw error;
    }
  }

  /**
   * Batch create multiple items
   */
  public async batchCreateItems<T>(
    listTitle: string,
    items: any[]
  ): Promise<T[]> {
    try {
      const [batchedSP, execute] = this.sp.batched();

      const promises = items.map(item =>
        batchedSP.web.lists.getByTitle(listTitle).items.add(item)
      );

      await execute();
      const results = await Promise.all(promises);

      // Clear cache for this list
      this.clearCacheByPattern(`list_${listTitle}`);

      return results.map(r => r.data) as T[];
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.batchCreateItems(${listTitle})`);
      throw error;
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<any> {
    const cacheKey = 'current_user';
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const user = await this.sp.web.currentUser();
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      ErrorHandlerService.handle(error as Error, 'PnPService.getCurrentUser');
      throw error;
    }
  }

  /**
   * Check if current user is in a SharePoint group
   */
  public async isUserInGroup(groupName: string): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      const groups = await this.sp.web.siteUsers.getById(currentUser.Id).groups();

      return groups.some(g => g.Title === groupName);
    } catch (error) {
      ErrorHandlerService.handle(error as Error, `PnPService.isUserInGroup(${groupName})`);
      return false;
    }
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  public clearAllCache(): void {
    this.cache.clear();
  }
}
