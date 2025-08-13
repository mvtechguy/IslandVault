# Bank Account Dialog Fix

## Issue
The "Add Bank Details" button in the admin panel sets the `showAddBank` state to true, but there's no corresponding dialog component that uses this state to display the bank details form.

## Solution
Add a bank account dialog component to the admin-page.tsx file, similar to the existing Package Creation/Edit Dialog.

### 1. Add Bank Account Mutation Functions

Add these mutation functions after the existing mutation functions (around line 377):

```typescript
// Bank account management mutations
const createBankAccountMutation = useMutation({
  mutationFn: async (data: any) => {
    const res = await apiRequest("POST", "/api/admin/bank-accounts", data);
    return res.json();
  },
  onSuccess: () => {
    toast({ title: "Bank account created successfully" });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
    setShowAddBank(false);
    setBankAccountForm({
      bankName: "",
      accountNumber: "",
      accountName: "",
      branchName: "",
      swiftCode: "",
      isActive: true,
      isPrimary: false
    });
  },
  onError: (error: Error) => {
    toast({
      title: "Failed to create bank account",
      description: error.message,
      variant: "destructive",
    });
  },
});

const updateBankAccountMutation = useMutation({
  mutationFn: async ({ id, data }: { id: number; data: any }) => {
    const res = await apiRequest("PUT", `/api/admin/bank-accounts/${id}`, data);
    return res.json();
  },
  onSuccess: () => {
    toast({ title: "Bank account updated successfully" });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
    setShowAddBank(false);
    setSelectedBankAccount(null);
  },
  onError: (error: Error) => {
    toast({
      title: "Failed to update bank account",
      description: error.message,
      variant: "destructive",
    });
  },
});
```

### 2. Add Bank Account Dialog Component

Add this dialog component at the end of the file, just before the closing `</div>` tag (around line 1929):

```tsx
{/* Bank Account Dialog */}
<Dialog open={showAddBank} onOpenChange={setShowAddBank}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center space-x-2">
        <Landmark className="w-5 h-5" />
        <span>{isEditingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</span>
      </DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          value={bankAccountForm.bankName}
          onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
          placeholder="e.g., Bank of Maldives"
        />
      </div>

      <div>
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          value={bankAccountForm.accountNumber}
          onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
          placeholder="e.g., 7701-123456-001"
        />
      </div>

      <div>
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          value={bankAccountForm.accountName}
          onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
          placeholder="e.g., Kaiveni Ltd"
        />
      </div>

      <div>
        <Label htmlFor="branchName">Branch Name</Label>
        <Input
          id="branchName"
          value={bankAccountForm.branchName}
          onChange={(e) => setBankAccountForm({ ...bankAccountForm, branchName: e.target.value })}
          placeholder="e.g., Male Branch"
        />
      </div>

      <div>
        <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
        <Input
          id="swiftCode"
          value={bankAccountForm.swiftCode}
          onChange={(e) => setBankAccountForm({ ...bankAccountForm, swiftCode: e.target.value })}
          placeholder="e.g., MALBMVMV"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="bankActive"
            checked={bankAccountForm.isActive}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, isActive: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="bankActive">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="bankPrimary"
            checked={bankAccountForm.isPrimary}
            onChange={(e) => setBankAccountForm({ ...bankAccountForm, isPrimary: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="bankPrimary">Primary Account</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={() => setShowAddBank(false)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            const bankData = {
              bankName: bankAccountForm.bankName,
              accountNumber: bankAccountForm.accountNumber,
              accountName: bankAccountForm.accountName,
              branchName: bankAccountForm.branchName,
              swiftCode: bankAccountForm.swiftCode || null,
              isActive: bankAccountForm.isActive,
              isPrimary: bankAccountForm.isPrimary
            };

            if (isEditingBankAccount && selectedBankAccount?.id) {
              updateBankAccountMutation.mutate({ id: selectedBankAccount.id, data: bankData });
            } else {
              createBankAccountMutation.mutate(bankData);
            }
          }}
          disabled={!bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.accountName || createBankAccountMutation.isPending || updateBankAccountMutation.isPending}
          className="bg-mint hover:bg-mint/90"
        >
          {isEditingBankAccount ? (
            <>
              <Edit className="w-4 h-4 mr-1" />
              Update Bank Account
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Add Bank Account
            </>
          )}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

## Implementation Steps

1. Open the `client/src/pages/admin-page.tsx` file
2. Add the bank account mutation functions after the existing mutation functions (around line 377)
3. Add the bank account dialog component at the end of the file, just before the closing `</div>` tag (around line 1929)
4. Save the file

After implementing these changes, the "Add Bank Details" button will open the dialog component, allowing users to add and edit bank accounts.