let client,
    streamerId,
    username,

    requestsStatus,
    queueCount = 0,
    maxRequests = 0;
    availableSlots = 0;

    songContainer = $('.song-container'), 
    livePractice = $('.top-label'),
    currentSong = $('.current-song'),
    requestedBy = $('.requested-by'),
    queueInfo = $('.queue-info');

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
  username = obj.detail.channel.username;
  livePractice.addClass('visible');

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
      availableSlots = maxRequests - data.status.songsPlayedToday - queueCount;

      let localRequestStatus = 'closed';

      if (requestsStatus === 'open' && availableSlots > 0) {
        localRequestStatus = 'open';
      } else if (requestsStatus === 'closed' && availableSlots > 0) {
        localRequestStatus = 'closed';
      } else if (requestsStatus === 'open' && availableSlots <= 0) {
        localRequestStatus = 'closed';
      }

      if (queueCount > 0) {
        

        if (data.list[0].song && data.list[0].song.attributeIds.some(id => id === 23951)) {
          livePractice.text(`Live Practice`);
          livePractice.removeClass('hidden').addClass('visible');
        } else if (data.list[0].nonlistSong) {
          livePractice.text(`Live Practice (YouTube)`);
          livePractice.removeClass('hidden').addClass('visible');
        } else {
          livePractice.removeClass('visible').addClass('hidden');
        }

        songContainer.removeClass('hidden').addClass('visible');
        
        if (data.list[0].song) {
          currentSong.html(`${data.list[0].song.artist} - ${data.list[0].song.title}`);
        } else {
          currentSong.html(`${data.list[0].nonlistSong}`);
        }

        requestedBy.html(`
          <span class="requested-by-label">Requested by</span>: 
          <span class="requester-name">${data.list[0].requests[0].name}</span>
        `);
        
      } else {
        songContainer.removeClass('visible').addClass('hidden');
        livePractice.removeClass('visible').addClass('hidden');
      }

      if (localRequestStatus === 'open') {
        queueInfo.html(`
          Requests: <span class="queue-open">${localRequestStatus}</span> | 
          <span class="info-highlight">${queueCount}</span> in queue | 
          <span class="info-highlight">${availableSlots}</span> slots available
        `);
      } else {
        queueInfo.html(`
          Requests: <span class="queue-closed">${localRequestStatus}</span> | 
          <span class="info-highlight">${queueCount}</span> in queue | 
          <span class="info-highlight">${availableSlots}</span> ${slotCaption()} available
        `);
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

const slotCaption = () => {
  if (availableSlots === 1) {
    return `slot`;
  } else {
    return `slots`;
  }
}
