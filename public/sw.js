self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json()
        const options = {
            body: data.body,
            icon: '/web-app-manifest-512x512.png',
            //badge: '/badge.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url,
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        }
        event.waitUntil(self.registration.showNotification(data.title, options))
    }
})
   
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const requestedUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            for (const client of windowClients) {
                if ('navigate' in client) {
                    return client.navigate(requestedUrl).then(function () {
                        return client.focus();
                    });
                }
            }
            return clients.openWindow(requestedUrl);
        })
    );
})
