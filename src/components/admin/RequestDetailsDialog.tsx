'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Hash, 
  AlertTriangle, 
  Printer, 
  Eye, 
  MapPin, 
  User, 
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ShoeRequest, RequestStatus, REQUEST_STATUSES } from '@/types/common';
import { RequestStatusBadge } from './common';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/input';
// Removed direct settings import - using API instead

interface RequestDetailsDialogProps {
  request: ShoeRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (requestId: string, status: RequestStatus, note: string) => void;
}

// Shipping label component
function ShippingLabelPreview({ request, hasMissingInfo }: { request: ShoeRequest; hasMissingInfo: boolean }) {
  const [showPreview, setShowPreview] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    name: "Walter Zhang",
    company: "New Steps Project",
    address: "348 Cardona Cir",
    city: "San Ramon",
    state: "CA",
    zipCode: "94583",
    phone: "(916) 582-7090"
  });

  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const settings = await response.json();
        
        setProjectInfo({
          name: "Walter Zhang", // Default founder name
          company: "New Steps Project",
          address: "348 Cardona Cir", // Default address
          city: "San Ramon",
          state: "CA",
          zipCode: "94583",
          phone: settings.projectPhone || "(916) 582-7090"
        });
      } catch (error) {
        console.error('Error loading project info for shipping label:', error);
        // Keep default values if API fails
      }
    };
    
    loadProjectInfo();
  }, []);

  const handlePrint = () => {
    if (hasMissingInfo) return; // Prevent printing if info is missing
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shipping Label - ${request.requestId}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .label { width: 4in; height: 6in; border: 2px solid #000; padding: 10px; }
              .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
              .section { margin: 10px 0; }
              .from, .to { border: 1px solid #ccc; padding: 8px; margin: 5px 0; }
              .items { background: #f5f5f5; padding: 8px; margin: 5px 0; }
              .barcode { text-align: center; font-family: monospace; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">NEW STEPS PROJECT - SHIPPING LABEL</div>
              
              <div class="section">
                <strong>FROM:</strong>
                <div class="from">
                  ${projectInfo.name}<br>
                  ${projectInfo.company}<br>
                  ${projectInfo.address}<br>
                  ${projectInfo.city}, ${projectInfo.state} ${projectInfo.zipCode}<br>
                  ${projectInfo.phone}
                </div>
              </div>
              
              <div class="section">
                <strong>TO:</strong>
                <div class="to">
                  ${request.requestorInfo.firstName} ${request.requestorInfo.lastName}<br>
                  ${request.shippingInfo?.street || 'Address not provided'}<br>
                  ${request.shippingInfo?.city || ''}, ${request.shippingInfo?.state || ''} ${request.shippingInfo?.zipCode || ''}<br>
                  ${request.requestorInfo.phone || 'Phone not provided'}
                </div>
              </div>
              
              <div class="section">
                <strong>CONTENTS:</strong>
                <div class="items">
                  ${request.items.map(item => 
                    `ID: ${item.shoeId || 'N/A'} - ${item.brand || 'Unknown'} ${item.name || 'Unknown'} (${item.sport || 'General'})`
                  ).join('<br>')}
                </div>
              </div>
              
              <div class="barcode">
                <strong>REF: ${request.requestId}</strong>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!showPreview) {
    return (
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={hasMissingInfo}
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Shipping Label
        </Button>
        
        {hasMissingInfo && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cannot preview shipping label due to missing information. Please ensure all shipping details are complete.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white max-w-sm mx-auto text-xs">
        <div className="text-center font-bold border-b pb-2 mb-3">
          NEW STEPS PROJECT - SHIPPING LABEL
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-xs">FROM:</div>
            <div className="border p-2 text-xs">
              {projectInfo.name}<br/>
              {projectInfo.company}<br/>
              {projectInfo.address}<br/>
              {projectInfo.city}, {projectInfo.state} {projectInfo.zipCode}<br/>
              {projectInfo.phone}
            </div>
          </div>
          
          <div>
            <div className="font-semibold text-xs">TO:</div>
            <div className="border p-2 text-xs">
              {request.requestorInfo.firstName} {request.requestorInfo.lastName}<br/>
              {request.shippingInfo?.street || 'Address not provided'}<br/>
              {request.shippingInfo?.city || ''}, {request.shippingInfo?.state || ''} {request.shippingInfo?.zipCode || ''}<br/>
              {request.requestorInfo.phone || 'Phone not provided'}
            </div>
          </div>
          
          <div>
            <div className="font-semibold text-xs">CONTENTS:</div>
            <div className="bg-gray-50 p-2 text-xs">
              {request.items.map((item, idx) => (
                <div key={idx}>
                  ID: {item.shoeId || 'N/A'} - {item.brand || 'Unknown'} {item.name || 'Unknown'} ({item.sport || 'General'})
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center font-mono font-bold border-t pt-2">
            REF: {request.requestId}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setShowPreview(false)}
          className="flex-1"
        >
          Hide Preview
        </Button>
        <Button
          onClick={handlePrint}
          disabled={hasMissingInfo}
          className="flex-1"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Label
        </Button>
      </div>
      
      {hasMissingInfo ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cannot print shipping label due to missing information. Please ensure all shipping details are complete before printing.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            After printing the shipping label, remember to update the request status to "Shipped".
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function RequestDetailsDialog({
  request,
  open,
  onOpenChange,
  onStatusChange,
}: RequestDetailsDialogProps) {
  const [status, setStatus] = useState<RequestStatus>(request?.currentStatus || REQUEST_STATUSES.SUBMITTED);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectionConfirm, setShowRejectionConfirm] = useState(false);
  
  // Add state for editable requestor information
  const [requestorInfo, setRequestorInfo] = useState({
    firstName: request?.requestorInfo.firstName || '',
    lastName: request?.requestorInfo.lastName || '',
    email: request?.requestorInfo.email || '',
    phone: request?.requestorInfo.phone || '',
    schoolName: request?.requestorInfo.schoolName || '',
    grade: request?.requestorInfo.grade || '',
    sportClub: request?.requestorInfo.sportClub || ''
  });
  
  // Add state for editable shipping information
  const [shippingInfo, setShippingInfo] = useState({
    street: request?.shippingInfo?.street || '',
    city: request?.shippingInfo?.city || '',
    state: request?.shippingInfo?.state || '',
    zipCode: request?.shippingInfo?.zipCode || '',
    country: request?.shippingInfo?.country || 'USA'
  });
  
  // Add state for request notes
  const [requestNotes, setRequestNotes] = useState(request?.notes || '');

  // Update local state when request changes
  useEffect(() => {
    if (request) {
      const currentStatus = request.statusHistory[0]?.status || 'submitted';
      setStatus(currentStatus);
      setNote('');
    }
  }, [request]);

  const handleSubmit = async () => {
    if (!request || !onStatusChange) return;
    
    // Show confirmation for rejection status
    if (status === 'rejected' && !showRejectionConfirm) {
      setShowRejectionConfirm(true);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onStatusChange(request.requestId, status, note);
      onOpenChange(false);
      setShowRejectionConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectionConfirm = async () => {
    if (!request || !onStatusChange) return;
    
    setIsSubmitting(true);
    setShowRejectionConfirm(false);
    
    try {
      await onStatusChange(request.requestId, status, note);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!request) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/requests`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.requestId,
          requestorInfo,
          shippingInfo,
          notes: requestNotes,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request details');
      }
      
      // Refresh the request data
      window.location.reload();
    } catch (error) {
      console.error('Error updating request details:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) {
    return null;
  }

  const currentStatus = request.statusHistory[0]?.status || 'submitted';
  const isRejected = currentStatus === 'rejected';

  // Check for missing shipping information
  const missingShippingInfo = [];
  if (!request.requestorInfo.firstName || !request.requestorInfo.lastName) {
    missingShippingInfo.push('Full name');
  }
  if (!request.shippingInfo?.street) missingShippingInfo.push('Street address');
  if (!request.shippingInfo?.city) missingShippingInfo.push('City');
  if (!request.shippingInfo?.state) missingShippingInfo.push('State');
  if (!request.shippingInfo?.zipCode) missingShippingInfo.push('ZIP code');
  if (!request.requestorInfo.phone) missingShippingInfo.push('Phone number');

  const hasMissingInfo = missingShippingInfo.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request Details
            <Badge variant="outline" className="ml-auto">
              {request.requestId}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage shoe request information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 overflow-y-auto flex-1">
          {/* Missing Information Alert */}
          {missingShippingInfo.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Missing shipping information:</strong> {missingShippingInfo.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Requester Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Requester Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={requestorInfo.firstName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={requestorInfo.lastName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={requestorInfo.email}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={requestorInfo.phone}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={requestorInfo.schoolName}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, schoolName: e.target.value })}
                  placeholder="School name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={requestorInfo.grade}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, grade: e.target.value })}
                  placeholder="Grade level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sportClub">Sport/Club</Label>
                <Input
                  id="sportClub"
                  value={requestorInfo.sportClub}
                  onChange={(e) => setRequestorInfo({ ...requestorInfo, sportClub: e.target.value })}
                  placeholder="Sport or club"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Date Submitted</Label>
                <p className="text-sm py-2">{formatDate(request.createdAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Requested Items with Shoe IDs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Requested Shoes
            </h3>
            <div className="space-y-3">
              {request.items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-brand" />
                      <span className="font-mono font-bold text-brand">
                        ID: {item.shoeId || 'N/A'}
                      </span>
                    </div>
                    {!item.shoeId && (
                      <Badge variant="destructive" className="text-xs">
                        Missing ID
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {item.name || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Brand:</span> {item.brand || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {item.size || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Gender:</span> {item.gender || 'Unknown'}
                    </div>
                    <div>
                      <span className="font-medium">Sport:</span> {item.sport || 'General'}
                    </div>
                    {item.condition && (
                      <div>
                        <span className="font-medium">Condition:</span> {item.condition}
                      </div>
                    )}
                  </div>
                  {item.notes && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Notes:</span> {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          {request.shippingInfo && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={shippingInfo.street}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, street: e.target.value })}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, zipCode: e.target.value })}
                      placeholder="ZIP code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingInfo.country}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Shipping Label Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Shipping Label
            </h3>
            <ShippingLabelPreview request={request} hasMissingInfo={hasMissingInfo} />
          </div>

          <Separator />

          {/* Status Management */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label htmlFor="status" className="w-24">Current:</Label>
                <RequestStatusBadge status={currentStatus} />
              </div>
              
              {isRejected ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This request has been rejected and cannot be changed to another status.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <Label htmlFor="status" className="w-24">Update to:</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as RequestStatus)}
                    >
                      <SelectTrigger id="status" className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(REQUEST_STATUSES).map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note about this status update..."
                      className="mt-1"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status History */}
          {request.statusHistory.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Status History
                </h3>
                <div className="space-y-2">
                  {request.statusHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-sm">
                      <RequestStatusBadge status={entry.status} className="mt-0.5" />
                      <div className="flex-1">
                        <p className="text-gray-600">{formatDate(entry.timestamp)}</p>
                        {entry.note && <p className="text-gray-700 mt-1">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Rejection Confirmation Dialog */}
        {showRejectionConfirm && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p><strong>⚠️ Warning: Rejecting this request</strong></p>
                <p>Once rejected, this request cannot be changed back to another status. This action will:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Immediately restore shoe inventory (make shoes available to others)</li>
                  <li>Send a rejection email to the requestor with your note</li>
                  <li>Permanently lock this request status</li>
                </ul>
                <p><strong>Please ensure you have added a clear explanation in the note section above.</strong></p>
                {!note.trim() && (
                  <p className="text-red-600 font-medium">
                    ⚠️ No note provided! Please add a reason for rejection in the note field above.
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectionConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRejectionConfirm}
                    disabled={!note.trim()}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          <Button 
            variant="secondary"
            onClick={handleSaveDetails}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Details'
            )}
          </Button>
          {!isRejected && (
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || status === currentStatus}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 