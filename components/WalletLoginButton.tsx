'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ensureProfile } from '@/app/actions/auth'

export function WalletLoginButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleWalletLogin() {
    // Check for an injected Ethereum provider (MetaMask, Coinbase Wallet, etc.)
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // signInWithWeb3 handles the full EIP-4361 flow:
      // 1. Generates a nonce from Supabase
      // 2. Constructs the SIWE message
      // 3. Prompts the wallet to sign it
      // 4. Verifies the signature server-side and returns a session
      const { error: authError } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Sign in to Moonshot Rewards Platform.',
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      // Session is now set in cookies by the @supabase/ssr browser client.
      // Create the profile row server-side before navigating.
      await ensureProfile()

      window.location.href = '/dashboard'
    } catch (err) {
      // User rejected the signature request in their wallet
      setError(err instanceof Error ? err.message : 'Wallet sign-in failed.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="outline"
        type="button"
        onClick={handleWalletLogin}
        disabled={loading}
        className="w-full"
      >
        {/* Ethereum diamond logo */}
        <svg className="size-4" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L6 16.5L16 21.5L26 16.5L16 2Z" fill="currentColor" opacity="0.8" />
          <path d="M6 16.5L16 21.5V30L6 16.5Z" fill="currentColor" opacity="0.45" />
          <path d="M26 16.5L16 30V21.5L26 16.5Z" fill="currentColor" opacity="0.8" />
          <path d="M16 2L6 16.5L16 13V2Z" fill="currentColor" opacity="0.45" />
          <path d="M16 2L26 16.5L16 13V2Z" fill="currentColor" />
        </svg>
        {loading ? 'Waiting for wallet…' : 'Continue with Ethereum'}
      </Button>

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
