window.addEventListener("load", () => {
	if ("serviceWorker" in navigator) {
		let root = location.pathname.replace(/\/demo\/.*/,'')

		navigator.serviceWorker.register(root + "/service-worker.js");

		navigator.serviceWorker.addEventListener('message', event => console.log(event.data));
	}
	if ("__TAURI__" in window) {
		Notification.showNotification = (title, option={}) => {
			if (typeof(title) == 'object') option = title;
			if (!("title" in option)) option.title = title;
			new Notification(option.title, option);
		}
		class TimestampTrigger{
			constructor(timestamp) {}
		}
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
			reg.showNotification(
				'Demo Push Notification',
				{
					tag: timestamp, // a unique ID
					body: body, // content of the push notification
					showTrigger: new TimestampTrigger(timestamp), // set the time for the push notification
					data: {
						url: window.location.href, // pass the current url to the notification
					},
					badge: '/images/icon.png',
					icon: '/images/icon.png',
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
	if (!("__TAURI__" in window)) {
		const reg = await navigator.serviceWorker.getRegistration();
		const notifications = await reg.getNotifications({
			includeTriggered: true
		});
		notifications.forEach(notification => notification.close());
		return `${notifications.length} notification(s) cancelled`;
	}
}

document.querySelector('#notification-button')?.addEventListener("click", () => sendNotificationAfter(5))
document.querySelector('#notification-cancel')?.addEventListener("click", () => alert(cancelNotifications()))
