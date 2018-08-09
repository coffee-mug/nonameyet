(function () {
  var state

  var playerController = {
    init () {
      this.connect()
      this.setupDOM()
      this.setupListener()
      window.onYouTubeIframeAPIReady = () => {
        this.onYouTubeIframeAPIReady.call(this)
      }
    },
    setupDOM () {
      var formVideo = document.getElementById('form-video')
      var root = document.createElement('div')
      root.id = 'player'
      formVideo.parentNode.insertBefore(root, formVideo) 

      // 2. This code loads the IFrame Player API code asynchronously.
      var tag = document.createElement('script')

      tag.src = 'https://www.youtube.com/iframe_api'
      var firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    },
    onYouTubeIframeAPIReady () {
      window.player = new YT.Player('player', {
        height: '390',
        width: document.documentElement.clientWidth.toString(),
        videoId: 'M7lc1UVf-VE',
        events: {
          'onReady': this.onPlayerReady
        }
      })
    },
    flash (message, type) {
      var domPlaceHolder = document.getElementById('flash')
      domPlaceHolder.textContent = message

      switch (type) {
        case 'error':
          domPlaceHolder.style.color = 'red'
          break
        default:
          break
      }

      // Fade it after 5 sec
      var to = setTimeout(() => {
        domPlaceHolder.textContent = ''
        clearTimeout(to)
      }, 5 * 1000)
    },
    validate (input) {
      var output = ''

      switch (true) {
        case /^https:\/\/www\.youtube\.com/.test(input):
          // normal url, id is in the "v" query param
          output = input.split('v=')[1]

          if (!output) {
            // May be an url extracted from the iframe embed code, let's try
            // something else
            output = /embed/.test(input) ? input.split('/').slice(-1)[0] : ''
          }
          break
        case /^https:\/\/youtu\.be/.test(input):
          output = input.split('/').slice(-1)[0]
          break
          // Curious enough to try ?
        case input === 'banana':
          output = 'h3ilLEN1Qew'
          break
          // Want to add a new video to the shortcut list ?
          // Feel welcome to shoot me your wish on https://twitter.com/lucaskostka
          // I'll do my best to add it quick.
        default:
          this.flash('Invalid URL, please submit a URL of the form "https://www.youtube.com/watch?" or "https://youtu.be/f4Mc-NYPHaQ"', 'error')
          output = 'aDm5WZ3QiIE'
      }

      return output
    },
    onPlayerReady: function onPlayerReady (event) {
      event.target.playVideo()

      this.state = {
        set videoId (newVideoId) {
          try {
            window.player.loadVideoById(newVideoId)
          } catch (e) {
            console.error(e)
          }
        }
      }
    },
    setupListener () {
      var updateForm = document.getElementById('form-video')
      var lastTimeSent = Date.now()

      updateForm.addEventListener('submit', function (e) {
        e.preventDefault()

        var newVideo = document.getElementById('input-video')
        var message = document.getElementById('input-message')
        var now = new Date()

        message = message.value.length < 255 ? message.value : message.value.slice(0, 255)

        // Set the message on the page
        document.getElementById('message').textContent = [now.getHours(), now.getMinutes()].join(':') + ' | ' + message

        var vidId = this.validate(newVideo.value)

        window.state.videoId = vidId

        // naive request spamming prevention
        if ((Date.now() - lastTimeSent) > 5 * 1000) {
          console.log('Allowed to share another video')

          var payload = { message: message, vidId: vidId }
          this.ws.send(JSON.stringify(payload))
        }

        lastTimeSent = Date.now()
        //  ah ah, DONE !
      }.bind(this))
    },
    connect () {
      var protocol = document.location.protocol === 'https:' ? 'wss' : 'ws'
      var port = document.location.port

      this.ws = new WebSocket(protocol + '://' + document.location.hostname + (port ? ':' + port : port))

      this.ws.onmessage = (payload) => {
        console.log('Received a new payload to display', payload)

        var parsedPayload = JSON.parse(payload.data)

        console.log(payload)

        // Display video if different than current one
        if (parsedPayload.vidId !== window.state.videoId) {
          window.state.videoId = payload.vidId
        }

        // And display th emessage if not-null
        if (parsedPayload.message) {
          var now = new Date()
          document.getElementById('message').textContent = [now.getHours(), now.getMinutes()].join(':') + ' | ' + parsedPayload.message
        }
      }
    }
  }

  playerController.init()
})()
