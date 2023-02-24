globalThis.modals = {};

class Modal {
	constructor(opts) {
		opts = { id: "", title: "", body: "", extrabutton: "", closebutton: "Close", "opener": false, ...opts };
		if (opts.id == "" || opts.title == "") return;

		let { id, title, body, extrabutton, closebutton, opener } = opts;
		if (extrabutton != '') body += `<button id="${extrabutton.toLowerCase()}Button">${extrabutton}</button>`
		let modalText = `<div id="${id}Modal" class="modal"><h2>${title}</h2>${body}<button id="${closebutton.toLowerCase()}Button">${closebutton}</button></div>`;
		document.body.insertAdjacentHTML('beforeEnd', modalText);
		this.element = document.querySelector(`#${id}Modal`);

		if (opener) document.querySelector(opener).addEventListener('click', () => this.open());
		this.element.querySelector(`#${closebutton.toLowerCase()}Button`)?.addEventListener('click', () => this.close());
	}
	open () {
		this.element.style.display = 'block';
		document.querySelector('#modalBackDrop').style.display = 'block';
	}
	close () {
		this.element.style.display = 'none';
		document.querySelector('#modalBackDrop').style.display = 'none';
	}
}

window.modals['newEvent'] = new Modal({ id: "newEvent", title: "New Event", body: '<input id="eventTitleInput" placeholder="Event Title" />', extrabutton: "Save", closebutton: "Cancel" });
window.modals['deleteEvent'] = new Modal({ id: "deleteEvent", title: "Event", body: '<p id="eventText"></p>', extrabutton: "Delete" });
window.modals['settings'] = new Modal({ id: "settings", title: "Settings", body: '<p>Needs to be done!</p><button id="exportCalendar">Export</button><br><br>', extrabutton: "Save", opener: "#setting > i" });

function closeModal2() {
	Object.keys(window.modals).forEach((k) => window.modals[k].close());
	closeModal();
}

document.body.insertAdjacentHTML('beforeEnd', '<div id="modalBackDrop"></div>');
document.querySelector("#exportCalendar").addEventListener("click", () => ical_download());



function ical_download(download=true){
	var comp = new ICAL.Component(['vcalendar', [], []]);
	comp.updatePropertyWithValue('prodid', '-//iCal.js Wiki Example');

	const events = JSON.parse(localStorage.events);

	for (let i=0; i<events.length; i++) {
		var vevent = new ICAL.Component('vevent'),
		    event = new ICAL.Event(vevent);
		event.summary = events[i].title;
		event.uid = 'abcdef...';
		event.startDate = ICAL.Time.fromJSDate(new Date(events[i].date), false);
		//event.startDate = ICAL.Time.now();
		comp.addSubcomponent(vevent);
	}

	var iCalendarData = comp.toString();

	/*
	var jcalData = ICAL.parse(iCalendarData);
	var vcalendar = new ICAL.Component(jcalData);
	var vevent = vcalendar.getFirstSubcomponent('vevent');
	var summary = vevent.getFirstPropertyValue('summary');
	console.log('Summary: ' + summary);
	*/
	this.fileName = "my-event.ics";

	this._save = function(fileURL){
		if (!window.ActiveXObject) {
			var save = document.createElement('a');
			save.href = fileURL;
			save.target = '_blank';
			save.download = this.fileName || 'unknown';

			var evt = new MouseEvent('click', {
				'view': window,
				'bubbles': true,
				'cancelable': false
			});
			save.dispatchEvent(evt);

			(window.URL || window.webkitURL).revokeObjectURL(save.href);
		}
		// for IE < 11
		else if ( !! window.ActiveXObject && document.execCommand) {
		     var _window = window.open(fileURL, '_blank');
		     _window.document.close();
		     _window.document.execCommand('SaveAs', true, this.fileName || fileURL)
		     _window.close();
		 }	
	}
	if (download) this._save( "data:text/calendar;charset=utf8," + escape(iCalendarData));
}
ical_download(false);
