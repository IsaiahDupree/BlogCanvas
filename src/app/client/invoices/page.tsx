'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Filter,
  Search
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Invoice {
  id: string
  invoiceNumber: string
  date: string
  dueDate: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  description: string
  pdfUrl?: string
}

export default function ClientInvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all')
  const [dateRange, setDateRange] = useState('all')

  // Mock data - would come from API
  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2026-024',
      date: 'Jan 19, 2026',
      dueDate: 'Jan 19, 2026',
      amount: 299.00,
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2025-023',
      date: 'Dec 19, 2025',
      dueDate: 'Dec 19, 2025',
      amount: 299.00,
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2025-022',
      date: 'Nov 19, 2025',
      dueDate: 'Nov 19, 2025',
      amount: 299.00,
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription'
    },
    {
      id: '4',
      invoiceNumber: 'INV-2025-021',
      date: 'Oct 19, 2025',
      dueDate: 'Oct 19, 2025',
      amount: 299.00,
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription'
    },
    {
      id: '5',
      invoiceNumber: 'INV-2025-020',
      date: 'Sep 19, 2025',
      dueDate: 'Sep 19, 2025',
      amount: 299.00,
      status: 'paid',
      description: 'Pro Plan - Monthly Subscription'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleDownload = (invoiceId: string) => {
    // Handle PDF download
    console.log('Download invoice:', invoiceId)
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
  const totalPending = invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0)
  const totalOverdue = invoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/client/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
              <p className="text-muted-foreground mt-1">View and download all your invoices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white border-2 border-green-100">
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-700">Paid</Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Paid</p>
          </Card>

          <Card className="p-6 bg-white border-2 border-yellow-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalPending.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Pending Payment</p>
          </Card>

          <Card className="p-6 bg-white border-2 border-red-100">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <Badge className="bg-red-100 text-red-700">Overdue</Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalOverdue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Overdue Amount</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white shadow-xl mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoices..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card className="bg-white shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{invoice.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {invoice.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <DollarSign className="w-4 h-4" />
                        {invoice.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(invoice.id)}
                        className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No invoices found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </Card>

        {/* Export Options */}
        <div className="mt-6 flex items-center justify-end gap-4">
          <Button variant="outline" className="hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300">
            <Download className="w-4 h-4 mr-2" />
            Export All (CSV)
          </Button>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download All (PDF)
          </Button>
        </div>
      </div>
    </div>
  )
}
