/*
    Plan2Go
    Copyright (C) 2022  TheDutchProgrammers

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

let nav = 0;
let clicked = null;
let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : [];

const calendar = document.getElementById('calendar');
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

globalThis.modals = {};

class Modal {
	constructor(opts) {
		opts = { id: "", title: "", body: "", extrabutton: "", closebutton: "Close", "opener": false, ...opts };
		if (opts.id == "" || opts.title == "") return;

		let { id, title, body, extrabutton, closebutton, opener } = opts;
		if (extrabutton != '') body += `<button id="${extrabutton.toLowerCase()}Button">${extrabutton}</button>`
		let modalText = `<div id="${id}Modal" class="modal"><h2>${title}</h2>${body}<button id="${closebutton.toLowerCase()}Button">${closebutton}</button></div>`;
		this.element = document.querySelector(`#${id}Modal`);
		if (this.element) this.element.outerHTML = modalText;
		else document.body.insertAdjacentHTML('beforeEnd', modalText);
		this.element = document.querySelector(`#${id}Modal`);

		if (opener) document.querySelector(opener).addEventListener('click', () => this.open());
		this.element.querySelector(`#${closebutton.toLowerCase()}Button`)?.addEventListener('click', () => this.close());

		this.opened = false;
	}
	open () {
		this.element.style.display = 'block';
		document.querySelector('#modalBackDrop').style.display = 'block';
		this.opened = true;
	}
	close () {
		this.element.style.display = 'none';
		document.querySelector('#modalBackDrop').style.display = 'none';
		this.opened = false;
	}
}

window.modals['newEvent'] = new Modal({ id: "newEvent", title: "New Event", body: '<input id="eventTitleInput" placeholder="Event Title" /><label for="eventStartInput">Event Start: </label><input id="eventStartInput" type="time" /><br><label for="eventEndInput">Event End: </label><input id="eventEndInput" type="time" /><br>', extrabutton: "Save", closebutton: "Cancel" });
window.modals['deleteEvent'] = new Modal({ id: "deleteEvent", title: "Event", body: '<p id="eventText"></p>', extrabutton: "Delete" });
window.modals['settings'] = new Modal({ id: "settings", title: "Settings", body: '<p>Needs to be done!</p><button id="exportCalendar">Export</button><button id="importCalendar">Import</button><br><br>', extrabutton: "Save", opener: "#setting > i" });
window.modals['settings'].element.querySelector("#exportCalendar").addEventListener("click", () => ical_download());
window.modals['settings'].element.querySelector("#importCalendar").addEventListener("click", () => start_ical_loader());
document.body.insertAdjacentHTML('beforeEnd', '<div id="modalBackDrop"></div>');
const uppercaseFirstChar = (string) => string[0].toLocaleUpperCase() + string.substring(1);

function migrateData(){
  if (!localStorage.getItem("events")) return;
  let items = JSON.parse(localStorage.getItem("events"));
  items.forEach(e => {
    if (!e.startDate) {
      const date = new Date(new Date(e.date).setHours(1));
      e.startDate = date.toLocaleString('en-US');
      e.endDate = new Date(date.setHours(24)).toLocaleString('en-US');
    }
  })
  localStorage.setItem("events", JSON.stringify(items));
  return items;
}
migrateData();

/// @source https://stackoverflow.com/a/70679783
const arrayContainsObject = (array, object) => array.some(item => Object.keys(item).every(key => item[key] === object[key]))

let eventTitleInput = document.getElementById('eventTitleInput');

function openModal(date, eventForDay = null) {
  clicked = date;

  if (eventForDay) {
    document.getElementById('eventText').innerText = `Title: ${eventForDay.title}\nFrom: ${new Date(eventForDay.startDate).toLocaleString('en-US')}\nTo: ${new Date(eventForDay.endDate).toLocaleString('en-US')}`; // SHOULD STAY 'en-US' since else the delete parser doesn't work
    window.modals['deleteEvent'].open();
  } else {
    window.modals['newEvent'].open()
  }
}

function load() {
  const dt = new Date();

  if (nav !== 0) {
    // If today is 31th, we need to set the date to 1, cause else we will 'skip' months
    // since if the next month is to 30, then 31 - 30 = next month 1st.
    if (dt.getDate() == 31) dt.setDate(1);
    dt.setMonth(dt.getMonth() + nav);
  }

  const day = dt.getDate();
  const month = dt.getMonth();
  const year = dt.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const paddingDays = weekdays.indexOf(dateString.split(', ')[0]);

  document.getElementById('monthDisplay').innerText = 
    `${uppercaseFirstChar(dt.toLocaleDateString(undefined, { month: 'long' }))} ${year}`; // undefined = fallback to user language

  calendar.innerHTML = '';

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    const dayString = `${month + 1}/${i - paddingDays}/${year}`;

    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;
      if (i - paddingDays === day && nav === 0) daySquare.id = 'currentDay';

      events.filter(e => e.date === dayString).forEach((eventForDay, i) => {
        if (i >= 2) return;
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = `${new Date(eventForDay.startDate).toLocaleTimeString(undefined,{hour:'numeric',minute:'numeric'})}-${new Date(eventForDay.endDate).toLocaleTimeString(undefined,{hour:'numeric',minute:'numeric'})} ${eventForDay.title}`;
        eventDiv.addEventListener('click', (e) => { e.stopPropagation(); openModal(dayString, eventForDay) });
        daySquare.appendChild(eventDiv);
      });

      daySquare.addEventListener('click', () => openModal(dayString));
    } else {
      daySquare.classList.add('padding');
    }

    calendar.appendChild(daySquare);    
  }
}

function closeModal() {
  let inputs = Array.from(document.querySelectorAll("input")).filter(e=>e.id!="checkbox");
  inputs.forEach(e=>{ e.classList.remove('error'); e.value=''; });
  Object.keys(window.modals).forEach((k) => window.modals[k].close());
  clicked = null;
  load();
}

function saveEvent(e) {
  let inputs = Array.from(e.target.parentElement.childNodes).filter(e=>e.nodeName=='INPUT')
  eventTitleInput = document.getElementById('eventTitleInput');
  if (inputs.filter(e=>e.value=='').length == 0) {
    inputs.forEach(e=>e.classList.remove('error'));

    events.push({
      date: clicked,
      title: inputs[0].value,
      date: new Date(clicked + " " + inputs[1].value).toLocaleDateString('en-US'),
      startDate: new Date(clicked + " " + inputs[1].value).toLocaleString('en-US'), //.toISOString(),
      endDate: new Date(clicked + " " + inputs[2].value).toLocaleString('en-US'), //.toISOString(),
    });

    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
  } else {
    inputs.filter(e=>e.value=='').forEach(e=>e.classList.add('error'));
  }
  initNotifications();

}

function deleteEvent() {
  const regex = /Title: ([^\n]+)\nFrom: ([0-9-\ :\/,APM]+)\nTo: ([0-9- :\/\,APM]+)/;
  const eventText = document.getElementById('eventText').innerText;
  let m;
  if ((m = regex.exec(eventText)) !== null) {
    let [_, title, startDate, endDate] = m;
    events = events.filter(e => !(e.date == clicked && e.title == title && e.startDate == startDate && e.endDate == endDate));
    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
    initNotifications();
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function initButtons() {
  document.getElementById('nextButton').addEventListener('click', () => {
    nav++;
    load();
  });

  document.getElementById('backButton').addEventListener('click', () => {
    nav--;
    load();
  });

  document.getElementById('todayButton').addEventListener('click', () => {
    nav = 0;
    load();
  });

  document.querySelectorAll('#saveButton')  .forEach(e=>e.addEventListener('click', (e) => saveEvent(e)));
  document.querySelectorAll('#cancelButton').forEach(e=>e.addEventListener('click', () => closeModal()));
  document.querySelectorAll('#deleteButton').forEach(e=>e.addEventListener('click', () => deleteEvent()));
  document.querySelectorAll('#closeButton') .forEach(e=>e.addEventListener('click', () => closeModal()));
  document.getElementById('modalBackDrop').addEventListener("click",() => closeModal());

  document.addEventListener('keyup', (e) => {if (("key" in e && e.key === "Escape") || (e.keyCode == 27)) closeModal();});
}

function initDarkmode() {
	const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]')
	const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
	const currentTheme = localStorage.getItem('theme') || ((prefersDarkScheme.matches) ? 'dark' : 'light');
	if (currentTheme) {
		document.documentElement.setAttribute('data-theme', currentTheme);
		if (currentTheme === 'dark') toggleSwitch.checked = true;
	}
	toggleSwitch.addEventListener('change', function(e) {
		if (e.target.checked) setTheme('dark')
		else setTheme('light');
	}, false);
}

function initNotifications() {
	cancelNotifications();
	if (events) {
		const notpassed = events.filter(a => new Date(a.startDate) > new Date());
		notpassed.forEach(e=>sendNotificationAfter(0, 'Event started: ' + e.title, new Date(e.startDate)));
	}
}

if ( window.addEventListener ) {
    var kkeys = [], a29uYW1p = "38,38,40,40,37,39,37,39,66,65";
    window.addEventListener('offline', () => { let e; if (e = document.querySelector("#offlineMessage")) e.hidden = false; });
    window.addEventListener('online', () => { let e; if (e = document.querySelector("#offlineMessage")) e.hidden = true; });
    window.addEventListener("keydown", function (e) { kkeys.push(e.keyCode); if (kkeys.toString().indexOf(a29uYW1p) >= 0 ) { setTheme(atob('aGFja2Vy')); kkeys = []; } }, true);
    if (!navigator.onLine) window.dispatchEvent(new Event('offline'));
}

function ical_download(download=true){
	var comp = new ICAL.Component(['vcalendar', [], []]);
	comp.updatePropertyWithValue('prodid', '-//Plan2Go Calendar');

	const events = JSON.parse(localStorage.events);

	for (let i=0; i<events.length; i++) {
		var vevent = new ICAL.Component('vevent'),
		    event = new ICAL.Event(vevent);
		event.summary = events[i].title;
		event.uid = 'abcdef...';
		event.startDate = ICAL.Time.fromJSDate(new Date(events[i].startDate), false);
		event.endDate = ICAL.Time.fromJSDate(new Date(events[i].endDate), false);
		comp.addSubcomponent(vevent);
	}

	var iCalendarData = comp.toString();

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


function ical_load(iCalendarData) {
  const jcalData = ICAL.parse(iCalendarData);
  const vcalendar = new ICAL.Component(jcalData);
  const vevents = vcalendar.getAllSubcomponents('vevent');
  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent);
    const eventObject = {
      "title": event.summary,
      "date": event.startDate.toJSDate().toLocaleDateString('en-US'),
      "startDate": event.startDate.toJSDate().toLocaleString('en-US'),
      "endDate": event.endDate.toJSDate().toLocaleString('en-US')
    }
    if (!arrayContainsObject(events, eventObject)) events.push(eventObject);
  })
  localStorage.setItem('events', JSON.stringify(events));
  load();
  return events;
}

document.body.insertAdjacentHTML("beforeend", '<input type="file" id="file-selector" accept=".ics" hidden>');
const fileSelector = document.querySelector('#file-selector')
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    const result = event.target.result;
    ical_load(atob(unescape(result.replace("data:text/calendar;base64,",""))));
  });
  reader.readAsDataURL(fileList[0]);
});

function start_ical_loader() {
  document.querySelector('#file-selector')?.click();
}

initButtons();
initDarkmode();
initNotifications();
load();