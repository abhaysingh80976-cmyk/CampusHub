import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

export default function useFetch(url, params = {}, enabled = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [url, key, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
