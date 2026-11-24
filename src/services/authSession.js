const CHANNEL_NAME = 'vegetable-shop-auth';

export function forceLogoutAccount(userId, reason = '') {
    const payload = {
        type: 'force-logout',
        userId: String(userId),
        reason
    };

    if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(payload);
        channel.close();
    }
}

export function listenForForcedLogout(onForcedLogout) {
    if (!('BroadcastChannel' in window)) return () => {};

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = event => {
        if (event.data?.type !== 'force-logout') return;
        onForcedLogout(event.data);
    };

    return () => channel.close();
}
