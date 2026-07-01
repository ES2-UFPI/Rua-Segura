import React from 'react';
import RouteSearchScreen from '@/components/RouteSearchScreen';
import { calculateSafeRoute } from '@/services/routeService';

export default function RouteSearchPage() {
  const handleSearch = async (data: { origin: string; destination: string }) => {
    return calculateSafeRoute(data);
  };

  return <RouteSearchScreen onSearch={handleSearch} />;
}
