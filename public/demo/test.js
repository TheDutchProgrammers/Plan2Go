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

setTimeout(() => {
	var old_closeModal = closeModal;
	closeModal = (arguments) => {
		old_closeModal.apply(this, arguments);
		Object.keys(window.modals).forEach((k) => window.modals[k].close());
	};
}, 100)

document.body.insertAdjacentHTML('beforeEnd', '<div id="modalBackDrop"></div>');
document.querySelector("#exportCalendar").addEventListener("click", () => ical_download());

function getWeekDays(locale=undefined) {
    const baseDate = new Date(Date.UTC(2017, 0, 2)); // just a Monday
    const weekDays = [];
    for(let i=0;i<7;i++) {
        weekDays.push(baseDate.toLocaleDateString(locale, { weekday: 'long' }));
        baseDate.setDate(baseDate.getDate() + 1);       
    }
    return weekDays;
}

const load2 = () => {
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
    `${dt.toLocaleDateString(undefined, { month: 'long' })} ${year}`; // undefined = fallback to user language
  document.getElementById('header').style.width = "780px"; // 800 - (10px margin * 2) 


  let calendar2 = document.querySelector("#tableing");
  calendar2.innerHTML = '';
  let tr = document.createElement("tr");
  tr.id = 'weekdays';
  tr.style.display = 'table-row';
  getWeekDays().forEach((a) => { 
     let td = document.createElement("td");
     td.innerText = a;
     tr.appendChild(td);
  })
  calendar2.appendChild(tr);

  let cal = document.createElement("tr");
  let ins = 0;

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
    if (i > 1 && (ins % 7) == 0) {
	calendar2.appendChild(cal);
        cal = document.createElement("tr");
        ins = 0;
    }
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    const dayString = `${month + 1}/${i - paddingDays}/${year}`;

    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;
      const eventForDay = events.find(e => e.date === dayString);

      if (i - paddingDays === day && nav === 0) daySquare.id = 'currentDay';

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

    let td = document.createElement("td");
    td.appendChild(daySquare);
    cal.appendChild(td);
    ins++;
  }
  calendar2.appendChild(cal);
};
setTimeout(() => {globalThis.load = () => load2(); load2()}, 0) // override the function after it has been declared (since this is loaded FIRST)


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
