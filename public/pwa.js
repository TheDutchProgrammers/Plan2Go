if ("__TAURI__" in window) {
	const { sendNotification, registerActionTypes } = window.__TAURI__.notification;
	Notification.notifications = [];
	Notification.showNotification = (title, option={}) => {
		if (typeof(title) == 'object') option = title;
		if (!("title" in option)) option.title = title;
		if ("timestamp" in option) Notification.notifications.push(setTimeout(() => new Notification(option.title, option), option.timestamp - new Date().getTime()));
		else new Notification(option.title, option);
	}
	Notification.getNotifications = (options={}) => {
		return Notification.notifications.map((id, i) => {
			return {
				"close": () => {
					clearTimeout(id);
					Notification.notifications.pop(i);
				}
			}
		});
	}
	registerActionTypes([
		{
			id: 'tauri',
			actions: [
				{
					action: 'open',
					title: 'Open app'
				},
				{
					action: 'close',
					title: 'Close notification'
				}
			]
		},
	]);
}

window.addEventListener("load", () => {
	if ("serviceWorker" in navigator) {
		const a = location.pathname.split("/"); a.pop(); const root = (a.join('/') + '/').replace(/\/demo\/.*/,'/'); 

		navigator.serviceWorker.register(root + "service-worker.js");

		navigator.serviceWorker.addEventListener('message', event => console.log(event.data));
	}
});

async function sendNotificationAfter(seconds=5, body='Hello World', timestamp=null) {
	let reg = await navigator.serviceWorker.getRegistration();
	if ("__TAURI__" in window) reg = Notification;
	Notification.requestPermission().then(permission => {
		if (permission !== 'granted') {
			alert('you need to allow push notifications');
		} else {
			if (!timestamp) timestamp = new Date().getTime() + seconds * 1000; // now plus 5000ms
			const a = location.pathname.split("/"); a.pop(); const root = (a.join('/') + '/').replace(/\/demo\/.*/,'/'); 
			reg.showNotification(
				'Plan2Go',
				{
					tag: timestamp, // a unique ID
					body: body, // content of the push notification
					timestamp: Math.floor(timestamp), // set the time for the push notification
					data: {
						url: window.location.href, // pass the current url to the notification
					},
					badge: root + 'images/icon.png',
					icon: root + 'images/icon.png',
					actionTypeId: 'tauri',
					actions: [
						{
							action: 'open',
							title: 'Open app'
						},
						{
							action: 'close',
							title: 'Close notification'
						}
					]
				}
			);
		}
	});
}
async function cancelNotifications() {
	let reg = await navigator.serviceWorker.getRegistration();
	if ("__TAURI__" in window) reg = Notification;
	const notifications = await reg.getNotifications({
		includeTriggered: true
	});
	notifications.forEach(notification => notification.close());
	return `${notifications.length} notification(s) cancelled`;
}

document.querySelector('#notification-button')?.addEventListener("click", () => sendNotificationAfter(5))
document.querySelector('#notification-cancel')?.addEventListener("click", async () => alert(await cancelNotifications()))
