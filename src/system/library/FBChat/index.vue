<template>
	<div id="fb-customer-chat" class="fb-customerchat" attribution="biz_inbox" v-bind="config"></div>
</template>

<script>
export default{
	methods:{
		fbAsyncInit(){
			FB.init({
				xfbml : true,
				version : 'v12.0' // in this case v12.0
			})
		},
		script(d, s, id){
			var js, fjs = d.getElementsByTagName(s)[0]
			if (d.getElementById(id)) { return }
				this.root(d, 'fb-root')
			if (!window.fbAsyncInit) {
				window.fbAsyncInit = this.fbAsyncInit
			}
			js = d.createElement(s) js.id = id
			js.async = js.defer = true
			js.src = 'https://connect.facebook.net/en_EN/sdk/xfbml.customerchat.js'
			fjs.parentNode.insertBefore(js, fjs)
		},
		root(d, id){
			if (d.getElementById(id)) { return }
			var el = d.createElement('div') el.id = id
			d.body.appendChild(el)
		}
	},
	mounted(){
		this.script(document, 'script', 'fb-customer-chat-jssdk')
	},
	computed:{
		config () {
			return {
				page_id : 242487699288528, // FB page id
				theme_color : '#0A7CFF',
				logged_in_greeting : 'Hi! How can we help you?',
				logged_out_greeting : 'Hi! How can we help you?',
				greeting_dialog_display : 'show',
				greeting_dialog_delay : 0
			}
		}
  },
}
</script>