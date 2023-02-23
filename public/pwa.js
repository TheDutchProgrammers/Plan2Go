window.addEventListener("load", () => {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("service-worker.js");
		navigator.serviceWorker.addEventListener('message', event => console.log(event.data));
	}
	if ("__TAURI__" in window) {
		class TimestampTrigger{
			constructor(timestamp) {this.timestamp = timestamp;}
		}
		window.TimestampTrigger = TimestampTrigger;
		Notification.notifications = [];
		Notification.showNotification = (title, option={}) => {
			if (typeof(title) == 'object') option = title;
			if (!("title" in option)) option.title = title;
			if ("showTrigger" in option) Notification.notifications.push(setTimeout(() => new Notification(option.title, option), option.showTrigger.timestamp - new Date().getTime()));
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
	}
});

document.querySelector('#notification-button').onclick = async () => {
	let reg = await navigator.serviceWorker.getRegistration();
	if ("__TAURI__" in window) reg = Notification;
	Notification.requestPermission().then(permission => {
		if (permission !== 'granted') {
			alert('you need to allow push notifications');
		} else {
			const timestamp = new Date().getTime() + 5 * 1000; // now plus 5000ms
			reg.showNotification(
				'Demo Push Notification',
				{
					tag: timestamp, // a unique ID
					body: 'Hello World', // content of the push notification
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
};
document.querySelector('#notification-cancel').onclick = async () => {
	let reg = await navigator.serviceWorker.getRegistration();
	if ("__TAURI__" in window) reg = Notification;
	const notifications = await reg.getNotifications({
		includeTriggered: true
	});
	notifications.forEach(notification => notification.close());
	console.log(`${notifications.length} notification(s) cancelled`);
};

