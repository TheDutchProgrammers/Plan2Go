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
