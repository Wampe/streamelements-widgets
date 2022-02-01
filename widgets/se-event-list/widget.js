let eventsLimit = 5,
    userLocale = "en-US",
    includeFollowers = true,
    includeRedemptions = true,
    includeHosts = true,
    minHost = 0,
    includeRaids = true,
    minRaid = 0,
    includeSubs = true,
    includeTips = true,
    minTip = 0,
    includeCheers = true,
    minCheer = 0,
    listOrientation = "column";

let userCurrency,
    totalEvents = 0;

window.addEventListener('onEventReceived', (obj) => {
    if (!obj.detail.event) {
      return;
    }

    if (typeof obj.detail.event.itemId !== "undefined") {
        obj.detail.listener = "redemption-latest";
    }

    const listener = obj.detail.listener.split("-")[0];
    const event = obj.detail.event;

    checkEvent(listener, event);
});

window.addEventListener('onWidgetLoad', (obj) => {
    let recents = obj.detail.recents;
    recents.sort(function (a, b) {
        return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });
    userCurrency = obj.detail.currency;
    const fieldData = obj.detail.fieldData;
    eventsLimit = fieldData.eventsLimit;
    includeFollowers = (fieldData.includeFollowers === "yes");
    includeRedemptions = (fieldData.includeRedemptions === "yes");
    includeHosts = (fieldData.includeHosts === "yes");
    minHost = fieldData.minHost;
    includeRaids = (fieldData.includeRaids === "yes");
    minRaid = fieldData.minRaid;
    includeSubs = (fieldData.includeSubs === "yes");
    includeTips = (fieldData.includeTips === "yes");
    minTip = fieldData.minTip;
    includeCheers = (fieldData.includeCheers === "yes");
    minCheer = fieldData.minCheer;
    userLocale = fieldData.locale;
    listOrientation = fieldData.listOrientation;

    for (let eventIndex = 0; eventIndex < recents.length; eventIndex++) {
        const event = recents[eventIndex];
        checkEvent(event.type, event);
    }
});

function checkEvent(type, event) {
    switch (type) {
        case 'follower':
            if (includeFollowers) {
                addEvent(type, 'Followed', event.name);
            }
        break;

        case 'redemption':
            if (includeRedemptions) {
                addEvent(type, 'Redeemed', event.name);
            }
        break;

        case 'subscriber':
            if (includeSubs) {
                addEvent(type, `Subscribed`, event.name);
            } 
        break;

        case 'host':
            if (includeHosts && minHost <= event.amount) {
                addEvent(type, `Host with ${event.amount.toLocaleString()} viewers`, event.name);
            }
        break;

        case 'cheer':
            if (includeCheers && minCheer <= event.amount) {
                addEvent(type, `Cheered ${event.amount.toLocaleString()} bits`, event.name);
            }
        break;

        case 'tip':
            if (includeTips && minTip <= event.amount) {
                if (event.amount === parseInt(event.amount)) {
                    addEvent(type, `Tipped ${event.amount.toLocaleString(userLocale, {
                        style: 'currency',
                        minimumFractionDigits: 0,
                        currency: userCurrency.code
                    })}`, event.name);
                } else {
                    addEvent(type, `Tipped ${event.amount.toLocaleString(userLocale, {
                        style: 'currency',
                        currency: userCurrency.code
                    })}`, event.name);
                }
            }
        break;

        case 'raid':
            if (includeRaids && minRaid <= event.amount) {
                addEvent(type, `Raid with ${event.amount.toLocaleString()} viewers`, event.name);
            }
        break;
    }
}

function addEvent(type, text, username) {
    totalEvents += 1;
    const element = `
        <div class="event-container" id="event-${totalEvents}">
            <div class="username-container">${username}</div>
            <div class="details-container">${text}</div>
            <div class="event-image event-${type}"></div>
        </div>`;
    
    $('.main-container').show().prepend(element);
    
    if (totalEvents > eventsLimit) {
        removeEvent(totalEvents - eventsLimit);
    }
}

function removeEvent(eventId) {
    let parameters;
    if (listOrientation === 'row' || listOrientation === 'row-reverse') {
        parameters = {
            width: 0,
            opacity: 0
        };
    } else {
        parameters = {
            height: 0,
            opacity: 0
        };
    }

    $(`#event-${eventId}`).animate(parameters, 200, () => {
        $(`#event-${eventId}`).remove();
    });
}
