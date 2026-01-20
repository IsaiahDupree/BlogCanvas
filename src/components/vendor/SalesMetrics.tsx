'use client';

import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, ShoppingCart, RefreshCw, Calendar, CreditCard } from 'lucide-react';

interface SalesMetricsProps {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  mrr: number;
  pendingAmount: number;
  currency?: string;
}

export default function SalesMetrics({
  totalRevenue,
  monthlyRevenue,
  totalOrders,
  avgOrderValue,
  mrr,
  pendingAmount,
  currency = 'USD'
}: SalesMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {totalOrders} orders
            </p>
          </div>
          <div className="rounded-lg p-3 bg-green-50 text-green-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(monthlyRevenue)}
            </p>
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active
            </p>
          </div>
          <div className="rounded-lg p-3 bg-blue-50 text-blue-600">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">MRR</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(mrr)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Recurring revenue
            </p>
          </div>
          <div className="rounded-lg p-3 bg-purple-50 text-purple-600">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(avgOrderValue)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Per transaction
            </p>
          </div>
          <div className="rounded-lg p-3 bg-orange-50 text-orange-600">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(pendingAmount)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Awaiting payment
            </p>
          </div>
          <div className="rounded-lg p-3 bg-yellow-50 text-yellow-600">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </Card>
    </div>
  );
}
