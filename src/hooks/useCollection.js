import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/databaseService';
import { localDb } from '../services/localDb';

/**
 * Custom hook for Stale-While-Revalidate (SWR) fetching of Firestore collections.
 * Instantly returns locally cached data to render the UI immediately,
 * while silently fetching the latest data in the background.
 */
export const useCollection = (collectionName, businessId = null, options = {}) => {
  const { 
    dependencies = [], // Array of values that trigger a refetch when changed
    sortBy = null,     // Function or object to sort data
    filterBy = null    // Function to filter data before setting state
  } = options;

  // Initial state reads synchronously from localDb to avoid initial render block
  const [data, setData] = useState(() => {
    try {
      const cached = businessId 
        ? localDb.getAll(collectionName, businessId)
        : localDb.getAll(collectionName);
      return cached || [];
    } catch (e) {
      return [];
    }
  });

  // Only true if we have absolutely NO data (empty cache), meaning we must show a skeleton
  const [loading, setLoading] = useState(data.length === 0);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState(null);

  const fetchLatest = useCallback(async () => {
    // If we have no businessId but require one (like sales, products), wait.
    if (!businessId && collectionName !== 'users' && collectionName !== 'businesses') {
      setLoading(false);
      return;
    }

    try {
      if (data.length === 0) setLoading(true);
      setIsRevalidating(true);
      setError(null);

      let freshData = await db.getCollection(collectionName, businessId);

      // Apply optional filtering/sorting locally
      if (filterBy) {
        freshData = freshData.filter(filterBy);
      }
      if (sortBy) {
        freshData = freshData.sort(sortBy);
      }

      setData(freshData);
    } catch (err) {
      console.error(`useCollection error for ${collectionName}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRevalidating(false);
    }
  }, [collectionName, businessId, ...dependencies]);

  useEffect(() => {
    let isMounted = true;
    
    // We don't await this so it happens asynchronously
    fetchLatest();

    return () => {
      isMounted = false;
    };
  }, [fetchLatest]);

  // Expose a mutate function for optimistic UI updates
  const mutate = useCallback((newData) => {
    setData(newData);
  }, []);

  return { data, loading, isRevalidating, error, mutate, refetch: fetchLatest };
};
