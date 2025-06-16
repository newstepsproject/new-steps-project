'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/user';
import { Separator } from '@/components/ui/separator';
import { UserIcon, Save, KeyRound, Loader2, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// User type matching the schema
type User = {
  _id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  emailVerified: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
};

type UserDetailsDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (userId: string, role: string) => void;
  onUserUpdate: (userId: string, data: Partial<User>) => void;
};

export default function UserDetailsDialog({
  user,
  open,
  onOpenChange,
  onRoleChange,
  onUserUpdate,
}: UserDetailsDialogProps) {
  // Basic info
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [selectedRole, setSelectedRole] = useState(user.role);
  
  // Address
  const [address, setAddress] = useState(user.address || {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  
  // School & Sports
  const [schoolName, setSchoolName] = useState(user.schoolName || '');
  const [grade, setGrade] = useState(user.grade || '');
  const [sports, setSports] = useState<string[]>(user.sports || []);
  const [sportClub, setSportClub] = useState(user.sportClub || '');
  const [newSport, setNewSport] = useState('');

  // Password reset state
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Sync form state with user prop when dialog opens or user changes
  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setPhone(user.phone);
    setSelectedRole(user.role);
    setAddress(user.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    });
    setSchoolName(user.schoolName || '');
    setGrade(user.grade || '');
    setSports(user.sports || []);
    setSportClub(user.sportClub || '');
    setNewSport('');
  }, [user, open]);

  // Track form changes
  const [hasChanges, setHasChanges] = useState(false);
  
  // Check for changes whenever any field changes
  useEffect(() => {
    const hasFormChanges = 
      firstName !== user.firstName ||
      lastName !== user.lastName ||
      email !== user.email ||
      phone !== user.phone ||
      selectedRole !== user.role ||
      JSON.stringify(address) !== JSON.stringify(user.address || {}) ||
      schoolName !== (user.schoolName || '') ||
      grade !== (user.grade || '') ||
      JSON.stringify(sports) !== JSON.stringify(user.sports || []) ||
      sportClub !== (user.sportClub || '');

    setHasChanges(hasFormChanges);
  }, [
    firstName, lastName, email, phone, selectedRole,
    address, schoolName, grade, sports, sportClub,
    user
  ]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Role badge color mapping
  const roleColors = {
    user: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
    superadmin: 'bg-red-100 text-red-800',
  };
  
  // Handle adding a new sport
  const handleAddSport = () => {
    if (newSport && !sports.includes(newSport)) {
      setSports([...sports, newSport]);
      setNewSport('');
    }
  };
  
  // Handle removing a sport
  const handleRemoveSport = (sportToRemove: string) => {
    setSports(sports.filter(sport => sport !== sportToRemove));
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    const updatedData: Partial<User> = {};
    
    // Basic info changes
    if (firstName !== user.firstName) updatedData.firstName = firstName;
    if (lastName !== user.lastName) updatedData.lastName = lastName;
    if (email !== user.email) updatedData.email = email;
    if (phone !== user.phone) updatedData.phone = phone;
    
    // Address changes
    if (JSON.stringify(address) !== JSON.stringify(user.address)) {
      updatedData.address = address;
    }
    
    // School & Sports changes
    if (schoolName !== user.schoolName) updatedData.schoolName = schoolName;
    if (grade !== user.grade) updatedData.grade = grade;
    if (JSON.stringify(sports) !== JSON.stringify(user.sports)) updatedData.sports = sports;
    if (sportClub !== user.sportClub) updatedData.sportClub = sportClub;
    
    // Only update if there are changes
    if (Object.keys(updatedData).length > 0) {
      onUserUpdate(user._id, updatedData);
    }
    
    // Update role if changed
    if (selectedRole !== user.role) {
      onRoleChange(user._id, selectedRole);
    }
    
    onOpenChange(false);
  };

  // Handle password reset email
  const handleSendPasswordReset = async () => {
    if (!confirm(`Are you sure you want to send a password reset email to ${user.email}?`)) {
      return;
    }
    
    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          action: 'send-email'
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Password reset email sent successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send password reset email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-base">
            <UserIcon className="mr-2 h-4 w-4" />
            User Details
          </DialogTitle>
          <DialogDescription className="text-xs">
            View and manage user information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2 overflow-y-auto flex-1">
          {/* Basic Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium">Basic Information</h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 py-1 text-xs flex items-center gap-1"
                onClick={handleSendPasswordReset}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <KeyRound className="h-3 w-3" />
                )}
                Reset Password
              </Button>
            </div>
            
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <Label htmlFor="firstName" className="text-right pt-1 text-xs">First Name:</Label>
              <Input 
                id="firstName" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="lastName" className="text-right pt-1 text-xs">Last Name:</Label>
              <Input 
                id="lastName" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="email" className="text-right pt-1 text-xs">Email:</Label>
              <Input 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="phone" className="text-right pt-1 text-xs">Phone:</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="role" className="text-right pt-1 text-xs">Role:</Label>
              <div className="col-span-3">
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 h-7 text-xs"
                >
                  <option value={UserRole.USER}>{UserRole.USER}</option>
                  <option value={UserRole.ADMIN}>{UserRole.ADMIN}</option>
                  <option value={UserRole.SUPERADMIN}>{UserRole.SUPERADMIN}</option>
                </select>
              </div>
              
              <Label className="text-right pt-1 text-xs">Joined:</Label>
              <div className="col-span-3 py-1 text-xs">{formatDate(user.createdAt)}</div>
              
              <Label className="text-right pt-1 text-xs">Verified:</Label>
              <div className="col-span-3 py-1 text-xs">
                <Badge variant={user.emailVerified ? "brand" : "destructive"}>
                  {user.emailVerified ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium">Address Information</h3>
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <Label htmlFor="street" className="text-right pt-1 text-xs">Street:</Label>
              <Input 
                id="street" 
                value={address.street} 
                onChange={(e) => setAddress({...address, street: e.target.value})} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="city" className="text-right pt-1 text-xs">City:</Label>
              <Input 
                id="city" 
                value={address.city} 
                onChange={(e) => setAddress({...address, city: e.target.value})} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="state" className="text-right pt-1 text-xs">State:</Label>
              <Input 
                id="state" 
                value={address.state} 
                onChange={(e) => setAddress({...address, state: e.target.value})} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="zipCode" className="text-right pt-1 text-xs">ZIP Code:</Label>
              <Input 
                id="zipCode" 
                value={address.zipCode} 
                onChange={(e) => setAddress({...address, zipCode: e.target.value})} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="country" className="text-right pt-1 text-xs">Country:</Label>
              <Input 
                id="country" 
                value={address.country} 
                onChange={(e) => setAddress({...address, country: e.target.value})} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
            </div>
          </div>

          {/* School & Sports Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium">School & Sports Information</h3>
            <Separator />
            <div className="grid grid-cols-4 gap-2 text-xs">
              <Label htmlFor="schoolName" className="text-right pt-1 text-xs">School:</Label>
              <Input 
                id="schoolName" 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="grade" className="text-right pt-1 text-xs">Grade:</Label>
              <Input 
                id="grade" 
                value={grade} 
                onChange={(e) => setGrade(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label htmlFor="sportClub" className="text-right pt-1 text-xs">Sport Club:</Label>
              <Input 
                id="sportClub" 
                value={sportClub} 
                onChange={(e) => setSportClub(e.target.value)} 
                className="col-span-3 h-7 px-2 py-1 text-xs"
              />
              
              <Label className="text-right pt-1 text-xs">Sports:</Label>
              <div className="col-span-3">
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Input 
                      value={newSport}
                      onChange={(e) => setNewSport(e.target.value)}
                      placeholder="Add a sport"
                      className="flex-1 h-7 px-2 py-1 text-xs"
                    />
                    <Button onClick={handleAddSport} size="sm" className="h-7 px-2 py-1 text-xs">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {sports.map((sport) => (
                      <Badge key={sport} variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1">
                        {sport}
                        <button
                          onClick={() => handleRemoveSport(sport)}
                          className="ml-1 hover:text-destructive text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 py-1 text-xs"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            className="gap-2 h-7 px-3 py-1 text-xs"
          >
            <Save className="h-3 w-3" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 