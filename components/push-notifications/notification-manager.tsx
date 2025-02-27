'use client'
 
import { sendNotification, subscribeUser, unsubscribeUser } from '@/lib/push-notifications/actions'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { LaughIcon, ShareIcon, Terminal, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
 
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function NotificationManager({existingSubscription}: {existingSubscription: PushSubscription | null}) {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(existingSubscription) //load it in
    const [hideAlert, setHideAlert] = useState(process.env.NODE_ENV != 'production')
   
    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])
   
    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
    }
   
    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            )
        })
        setSubscription(sub)
        const serializedSub = JSON.parse(JSON.stringify(sub))
        const results = await subscribeUser(serializedSub)
        if (results.success) {
            toast.success("Ahh inside jokes… I'd love to be a part of one one day")
            await sendNotification('Notifications will look like this', 'Hola')
        }
    }
   
    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }
   
    if (!isSupported) {
        return (
            hideAlert ?
                null
            :
            (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle className='flex items-center'>
                        <div className='flex-grow'>
                            Hi family!
                        </div>
                        <Button variant={'ghost'} size={'icon'} onClick={() => setHideAlert(true)}>
                            <XIcon className='w-4 h-4' />
                        </Button>
                    </AlertTitle>
                    <AlertDescription>
                        <p className='pb-4'>
                            You can download this by clicking the share button<ShareIcon className='w-4 h-4 mx-2 inline'/> and &ldquo;Add to Home Screen&rdquo;
                        </p>
                        <p>This will also let you get notifications when family members share insights! <LaughIcon className='w-4 h-4 inline-block' /></p>
                    </AlertDescription>
                </Alert>
            )
        )
    }
   
    return (
        <div>
            { subscription && process.env.NODE_ENV != "production" ? 
                <Button onClick={unsubscribeFromPush}>Unsubscribe</Button>
            : subscription && process.env.NODE_ENV == "production" ? null 
            : hideAlert ? null : (
            <>
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle className='flex items-center'>
                    <div className='flex-grow'>
                        Hi family!
                    </div>
                    <Button variant={'ghost'} size={'icon'} onClick={() => setHideAlert(true)}>
                        <XIcon className='w-4 h-4' />
                    </Button>
                </AlertTitle>
                <AlertDescription>
                    <p className='flex'>
                        You can &ldquo;download&rdquo; this by clicking share <ShareIcon className='w-4 h-4 mx-2'/> and &ldquo;Add to Home Screen&rdquo;
                    </p>
                    <Button onClick={subscribeToPush}>Enable Push Notifications to Get Family Updates! <LaughIcon className='w-2 h-2' /></Button>
                </AlertDescription>
            </Alert>
                
            </>
            )}
        </div>
        )
  }