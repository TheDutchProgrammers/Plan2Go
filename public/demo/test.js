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

function getWeekDays(locale=undefined) {
  const baseDate = new Date(Date.UTC(2017, 0, 2)); // just a Monday
  const weekDays = [];
  for(let i=0;i<7;i++) {
    weekDays.push(uppercaseFirstChar(baseDate.toLocaleDateString(locale, { weekday: 'long' })));
    baseDate.setDate(baseDate.getDate() + 1);       
  }
  return weekDays;
}

const load2 = () => {
  const dt = new Date();

  if (nav !== 0) dt.setMonth(dt.getMonth() + nav);

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

  document.getElementById('monthDisplay').innerText = dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); // undefined = fallback to user language
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

    let td = document.createElement("td");
    td.appendChild(daySquare);
    cal.appendChild(td);
    ins++;
  }
  calendar2.appendChild(cal);
};

function saveEvent2(e) {
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
}

function openModal2(date, eventForDay = null) {
  clicked = date;
  //if (eventForDay == null) eventForDay = events.find(e => e.date === clicked);

  if (eventForDay) {
    document.getElementById('eventText').innerText = `Title: ${eventForDay.title}\nFrom: ${new Date(eventForDay.startDate).toLocaleString('en-US')}\nTo: ${new Date(eventForDay.endDate).toLocaleString('en-US')}`; // SHOULD STAY 'en-US' since else the delete parser doesn't work
    window.modals['deleteEvent'].open();
  } else {
    window.modals['newEvent'].open()
  }
}

function deleteEvent2() {
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

function ical_download2(download=true){
  var comp = new ICAL.Component(['vcalendar', [["prodid",{},"text","-//Plan2Go Calendar"]], []]);

  const events = JSON.parse(localStorage.events);
  for (let i=0; i<events.length; i++) {
    let vevent = new ICAL.Component('vevent'), event = new ICAL.Event(vevent);
    event.summary = events[i].title;
    event.uid = 'abcdef...';
    event.startDate = ICAL.Time.fromJSDate(new Date(events[i].startDate), false);
    event.endDate = ICAL.Time.fromJSDate(new Date(events[i].endDate), false);
    comp.addSubcomponent(vevent);
  }

  const iCalendarData = comp.toString();

  this.fileName = "Plan2Go_export.ics";

  this._save = function(fileURL){
    if (!window.ActiveXObject) {
      let save = document.createElement('a');
      save.href = fileURL;
      save.target = '_blank';
      save.download = this.fileName || 'unknown';

      const evt = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
      });
      save.dispatchEvent(evt);

      (window.URL || window.webkitURL).revokeObjectURL(save.href);
    }
    // for IE < 11
    else if ( !! window.ActiveXObject && document.execCommand) {
      let _window = window.open(fileURL, '_blank');
      _window.document.close();
      _window.document.execCommand('SaveAs', true, this.fileName || fileURL)
      _window.close();
    }	
  }
  if (download) this._save( "data:text/calendar;charset=utf8," + escape(iCalendarData));
  else return iCalendarData;
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
  console.log("Done!");
  return events;
}

function start_ical_loader() {
  document.querySelector('#file-selector')?.click();
}

setTimeout(() => {
  globalThis.load = () => load2();
  globalThis.ical_download = () => ical_download2();	
  globalThis.saveEvent = (e) => saveEvent2(e);
  globalThis.openModal = (date, ed=null) => openModal2(date, ed)
  globalThis.deleteEvent = () => deleteEvent2()
  window.modals['newEvent'] = new Modal({ id: "newEvent", title: "New Event", body: '<input id="eventTitleInput" placeholder="Event Title" /><label for="eventStartInput">Event Start: </label><input id="eventStartInput" type="time" /><br><label for="eventEndInput">Event End: </label><input id="eventEndInput" type="time" /><br>', extrabutton: "Save", closebutton: "Cancel" });
  window.modals['newEvent'].element.querySelector('#saveButton').addEventListener('click', (e) => saveEvent(e));
  window.modals['newEvent'].element.querySelector('#cancelButton').addEventListener('click', () => closeModal());
  window.modals['settings'] = new Modal({ id: "settings", title: "Settings", body: '<p>Needs to be done!</p><button id="exportCalendar">Export</button><button id="importCalendar">Import</button><br><br>', extrabutton: "Save", opener: "#setting > i" });
  window.modals['settings'].element.querySelector("#exportCalendar").addEventListener("click", () => ical_download());
  window.modals['settings'].element.querySelector("#importCalendar").addEventListener("click", () => start_ical_loader());


  //initButtons();
  load2();
  if (events) {
    cancelNotifications();
    const notpassed = events.filter(a => new Date(a.startDate) > new Date());
    notpassed.forEach(e=>sendNotificationAfter(0, 'Event started: ' + e.title, new Date(e.startDate)));
  }
}, 1) // override the function after it has been declared (since this is loaded FIRST)
