'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { AppShell } from '@/components/shell/app-shell'
import { PageHeader } from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type Account,
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount
} from '@/lib/api/accounts'
import { formatCurrency, maskAccountNumber } from '@/lib/format'
import {
  type CreateAccountFormValues,
  createAccountFormSchema,
  type EditAccountFormValues,
  editAccountFormSchema
} from '@/lib/schemas/accounts'

type View = 'list' | 'add' | 'edit'

export default function BankAccountsPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('list')
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  })

  const createForm = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountFormSchema),
    defaultValues: { accountNumber: '', accountName: '', pin: '' }
  })

  const editForm = useForm<EditAccountFormValues>({
    resolver: zodResolver(editAccountFormSchema),
    defaultValues: { accountName: '' }
  })

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      createForm.reset()
      setFormError(null)
      setView('list')
    },
    onError: (err) => {
      setFormError(
        err instanceof Error ? err.message : 'Failed to add account.'
      )
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      setFormError(null)
      setEditingAccount(null)
      setView('list')
    },
    onError: (err) => {
      setFormError(
        err instanceof Error ? err.message : 'Failed to update account.'
      )
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['overview'] })
      setDeleteError(null)
      setDeleteTarget(null)
    },
    onError: (err) => {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete account.'
      )
    }
  })

  function openAdd() {
    setFormError(null)
    createForm.reset()
    setView('add')
  }

  function openEdit(account: Account) {
    setFormError(null)
    setEditingAccount(account)
    editForm.reset({ accountName: account.accountName })
    setView('edit')
  }

  function onCreateSubmit(values: CreateAccountFormValues) {
    setFormError(null)
    createMutation.mutate({
      account_number: values.accountNumber,
      account_name: values.accountName,
      pin: values.pin || undefined
    })
  }

  function onEditSubmit(values: EditAccountFormValues) {
    if (!editingAccount) return
    setFormError(null)
    updateMutation.mutate({
      id: editingAccount.id,
      account_name: values.accountName
    })
  }

  return (
    <AppShell>
      <PageHeader
        title="Accounts"
        actions={
          view === 'list' ? (
            <Button onClick={openAdd}>
              <Plus className="size-4" />
              Add account
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setView('list')}>
              Back to list
            </Button>
          )
        }
      />

      {view === 'list' &&
        (accountsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : accountsQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive text-sm">
                {accountsQuery.error instanceof Error
                  ? accountsQuery.error.message
                  : 'Failed to load accounts.'}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => accountsQuery.refetch()}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : accountsQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Wallet className="size-6" />
              </span>
              <p className="font-medium">No accounts yet</p>
              <p className="max-w-sm text-muted-foreground text-sm">
                Add your first bank account to get started.
              </p>
              <Button onClick={openAdd}>
                <Plus className="size-4" />
                Add account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accountsQuery.data?.map((account) => (
              <Card key={account.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {account.accountName}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {maskAccountNumber(account.accountNumber)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${account.accountName}`}
                        onClick={() => openEdit(account)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${account.accountName}`}
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(account)
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-xl">
                    {formatCurrency(account.balance)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {view === 'add' && (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Add account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={createForm.handleSubmit(onCreateSubmit)}
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="accountNumber">Account number</FieldLabel>
                <Input
                  id="accountNumber"
                  inputMode="numeric"
                  aria-invalid={Boolean(
                    createForm.formState.errors.accountNumber
                  )}
                  {...createForm.register('accountNumber')}
                />
                <FieldError>
                  {createForm.formState.errors.accountNumber?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="accountName">Account name</FieldLabel>
                <Input
                  id="accountName"
                  aria-invalid={Boolean(
                    createForm.formState.errors.accountName
                  )}
                  {...createForm.register('accountName')}
                />
                <FieldError>
                  {createForm.formState.errors.accountName?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="pin">PIN (optional)</FieldLabel>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="off"
                  aria-invalid={Boolean(createForm.formState.errors.pin)}
                  {...createForm.register('pin')}
                />
                <FieldError>
                  {createForm.formState.errors.pin?.message}
                </FieldError>
              </Field>

              {formError ? (
                <p role="alert" className="text-destructive text-sm">
                  {formError}
                </p>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView('list')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Add account'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {view === 'edit' && editingAccount ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Rename account</CardTitle>
            <p className="text-muted-foreground text-sm">
              {maskAccountNumber(editingAccount.accountNumber)}
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="editAccountName">Account name</FieldLabel>
                <Input
                  id="editAccountName"
                  aria-invalid={Boolean(editForm.formState.errors.accountName)}
                  {...editForm.register('accountName')}
                />
                <FieldError>
                  {editForm.formState.errors.accountName?.message}
                </FieldError>
              </Field>

              {formError ? (
                <p role="alert" className="text-destructive text-sm">
                  {formError}
                </p>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setView('list')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This will permanently remove{' '}
              <strong>{deleteTarget?.accountName}</strong> (
              {deleteTarget
                ? maskAccountNumber(deleteTarget.accountNumber)
                : ''}
              ). Accounts with a non-zero balance cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate({ id: deleteTarget.id })
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
