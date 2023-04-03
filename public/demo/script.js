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
document.body.insertAdjacentHTML('beforeEnd', '<div id="modalBackDrop"></div>');
document.querySelector("#exportCalendar").addEventListener("click", () => ical_download());

const eventTitleInput = document.getElementById('eventTitleInput');

function openModal(date) {
  clicked = date;

  const eventForDay = events.find(e => e.date === clicked);

  if (eventForDay) {
    document.getElementById('eventText').innerText = eventForDay.title;
    window.modals['deleteEvent'].open();
  } else {
    window.modals['newEvent'].open()
  }
}

function load() {
  const dt = new Date();

  if (nav !== 0) dt.setMonth(new Date().getMonth() + nav);

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
    `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;

  calendar.innerHTML = '';

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    const dayString = `${month + 1}/${i - paddingDays}/${year}`;

    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;
      const eventForDay = events.find(e => e.date === dayString);

      if (i - paddingDays === day && nav === 0) {
        daySquare.id = 'currentDay';
      }

      if (eventForDay) {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = eventForDay.title;
        daySquare.appendChild(eventDiv);
      }

      daySquare.addEventListener('click', () => openModal(dayString));
    } else {
      daySquare.classList.add('padding');
    }

    calendar.appendChild(daySquare);    
  }
}

function closeModal() {
  eventTitleInput?.classList?.remove('error');
  Object.keys(window.modals).forEach((k) => window.modals[k].close());
  eventTitleInput.value = '';
  clicked = null;
  load();
}

function saveEvent() {
  if (eventTitleInput.value) {
    eventTitleInput.classList.remove('error');

    events.push({
      date: clicked,
      title: eventTitleInput.value,
    });

    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
  } else {
    eventTitleInput.classList.add('error');
  }
}

function deleteEvent() {
  events = events.filter(e => e.date !== clicked);
  localStorage.setItem('events', JSON.stringify(events));
  closeModal();
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

  document.getElementById('saveButton').addEventListener('click', saveEvent);
  document.getElementById('cancelButton').addEventListener('click', closeModal);
  document.getElementById('deleteButton').addEventListener('click', deleteEvent);
  document.getElementById('closeButton').addEventListener('click', closeModal);

  document.getElementById('modalBackDrop').addEventListener("click",closeModal);
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

if ( window.addEventListener ) {
    var kkeys = [], a29uYW1p = "38,38,40,40,37,39,37,39,66,65";
    window.addEventListener("keydown", function(e){
        kkeys.push(e.keyCode);
        if (kkeys.toString().indexOf(a29uYW1p) >= 0 ) {
            setTheme(atob('aGFja2Vy'));
            kkeys = [];
        }
    }, true);
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

initButtons();
initDarkmode();
load();
