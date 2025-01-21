"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Key, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { UserAccount } from "@/lib/auth/definitions"
import { accounts } from "@/lib/auth/accounts"

export default function LoginFlow() {
  const [step, setStep] = useState<"password" | "account">("password")
  const [password, setPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null)

  const handleAccountSelect = async (account: UserAccount) => {
    setSelectedAccount(account)
    setIsVerifying(true)
    console.log(account)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password, userAccount: account }),
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      if (response.ok) {
        window.location.href = '/'
        return
      } else {
        toast.warning('Failed to log in. Please try again.');
      }
    } catch (err) {
      console.error('Error logging in:', err);
      toast.warning('Failed to log in. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            {step === "password" ? (
              <PasswordStep
                key="password"
                password={password}
                setPassword={setPassword}
                setStep={setStep}
                isVerifying={isVerifying}
              />
            ) : (
              <AccountStep
                key="account"
                accounts={accounts}
                onSelect={handleAccountSelect}
                isVerifying={isVerifying}
                selectedAccount={selectedAccount}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

interface PasswordStepProps {
  password: string
  setPassword: (value: string) => void
  setStep: Dispatch<SetStateAction<"password" | "account">>
  isVerifying: boolean
}

function PasswordStep({ password, setPassword, setStep, isVerifying }: PasswordStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto w-12 h-12 bg-primary/35 rounded-full flex items-center justify-center"
          >
            <Key className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Enter the secret password to continue</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter the secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isVerifying}
              required
              className="text-lg text-center tracking-wider"
            />
          </div>
          <Button 
            className="w-full"
            onClick={() => setStep("account")}
          >
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

interface AccountStepProps {
  accounts: UserAccount[]
  onSelect: (account: UserAccount) => void
  isVerifying: boolean
  selectedAccount: UserAccount | null
}

function AccountStep({ accounts, onSelect, isVerifying, selectedAccount }: AccountStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mx-auto w-12 h-12 bg-primary/45 rounded-full flex items-center justify-center"
          >
            <UserCircle2 className="w-6 h-6 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-tight">Choose account</h1>
          <p className="text-sm text-muted-foreground">Select your account to continue</p>
        </div>
        <div className="space-y-2">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start p-4 h-auto"
                onClick={() => onSelect(account)}
                disabled={isVerifying}
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={account.avatar} alt={account.name} />
                    <AvatarFallback>{account.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{account.name}</div>
                  </div>
                  {isVerifying && selectedAccount?.id === account.id && (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  )}
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

