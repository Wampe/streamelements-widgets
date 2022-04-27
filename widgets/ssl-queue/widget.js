let client,
    streamerId,
    username,

    emptyQueueVisibilty,
    headerVisibilty,
    headerTemplateFirstRow,
    headerTemplateSecondRow,
    queueSpacerText,
    queueTemplateFirstRow,
    queueTemplateSecondRow,

    requestsStatus,
    queueLimit = 5;
    queueCount = 0,
    maxRequests = 0;
    songsPlayedToday = 0;
    availableSlots = 0;

    queueHeader = $('.queue-header'),
    queueSpacer = $('.queue-spacer'),
    queue = $('.queue-list');

$.getScript('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js')
  .done(() => {

    client = io(`https://api.streamersonglist.com`);

    client.on('connect', () => {

      client.on('queue-update', () => {
        getQueue();
      });
    
      client.on('reload-song-list', () => {
        getQueue();
      });
    
      client.on('update-streamer', () => {
        getStreamer().then(() => {
          getQueue();
        });
      });
    
    });
  });

window.addEventListener('onWidgetLoad', (obj) => {
  const fieldData = obj.detail.fieldData;
  const channel = obj.detail.channel;
  username = channel.username;
  queueLimit = fieldData.queueLimit;

  emptyQueueVisibilty = fieldData.emptyQueueVisibilty;
  headerVisibilty = fieldData.headerVisibilty;
  headerTemplate = fieldData.headerTemplate;

  headerTemplateFirstRow = fieldData.headerTemplateFirstRow;
  headerTemplateSecondRow = fieldData.headerTemplateSecondRow;
  queueSpacerText = fieldData.queueSpacerText;
  queueTemplateFirstRow = fieldData.queueTemplateFirstRow;
  queueTemplateSecondRow = fieldData.queueTemplateSecondRow;

  getStreamer().then(data => {
    streamerId = data.id;

    client.emit('join-room', `${data.id}`);      
    getQueue();
  });
});

function getQueue() {
  fetch(`https://api.streamersonglist.com/v1/streamers/${streamerId}/queue`)
    .then(response => response.json())
    .then(data => {
      queueCount = data.list.length;
      songsPlayedToday = data.status.songsPlayedToday;
      availableSlots = maxRequests - songsPlayedToday - queueCount;

      if (headerVisibilty === 'visible') {
        const header = `
          <div class="header-container">
            <div class="header-template-first-row">${wrapText(headerTemplateFirstRow)}</div>
            <div class="header-template-second-row">${wrapText(headerTemplateSecondRow)}</div>
          </div>
        `;
        queueHeader.empty();
        queueHeader.show().append(header);  
      }

      queueSpacer.empty().show().append(queueSpacerText);
      queue.empty();

      if (queueCount > 0) {
        for (let index = 0; index < queueLimit; index++) {
          const item = data.list[index];
          if (item === undefined || index === queueLimit) {
            break;
          }
          const element = `
            <div class="queue-item">
              <img class="queue-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_f03fc145c74145419d8960f3c4dd6d16/static/light/1.0">
              <div class="queue-template-first-row">${wrapSong(queueTemplateFirstRow, item)}</div>
              <div class="queue-template-second-row">${wrapSong(queueTemplateSecondRow, item)}</div>
            </div>
          `;
          queue.show().append(element);  
        }
      } else {
        if (emptyQueueVisibilty === 'visible') {
          const element = `<div class="queue-empty">{queueEmptyText}</div>`;
          queue.show().append(element);  
        }
      }
    });
}

const getStreamer = () => {
  return new Promise(resolve => { 
    fetch(`https://api.streamersonglist.com/v1/streamers/${username}`)
      .then(response => response.json())
      .then(data => {
        maxRequests = data.maxRequests;

        if (data.requestsActive) {
          requestsStatus = 'open';
        } else {
          requestsStatus = 'closed';
        }

        resolve(data)
      });
  });
}

const wrapSong = (text, item) => {
  if (item.song) {
    return text
    .replace("{songArtist}", item.song.artist)
    .replace("{songTitle}", item.song.title);
  } 

  return text
    .replace("{songArtist}", 'YouTube')
    .replace("{songTitle}", item.nonlistSong);
}

const wrapText = (text) => {
  return text
    .replace("{maxRequests}", maxRequests)
    .replace("{requestsStatus}", `<span class="header-info-highlight">${localRequestStatus(requestsStatus, availableSlots)}</span>`)
    .replace("{songCaption}", songCaption())
    .replace("{queueCount}", `<span class="header-info-highlight">${queueCount}</span>`)
    .replace("{songsPlayedToday}", songsPlayedToday)
    .replace("{availableSlots}", `<span class="header-info-highlight">${availableSlots}</span>`)
    .replace("{slotCaption}", slotCaption());
};

const localRequestStatus = (status, slots) => {
  if (status === 'open' && slots > 0) {
    return 'open';
  } else if (status === 'closed' && slots > 0) {
    return 'closed';
  } else if (slots <= 0) {
    return 'closed'; 
  }
}

const songCaption = () => {
  if (queueCount === 1) {
    return `song`;
  } else {
    return `songs`;
  }
}

const slotCaption = () => {
  if (availableSlots === 1) {
    return `slot`;
  } else {
    return `slots`;
  }
}
