import { ThemeProvider, CSSReset, ColorModeProvider } from '@chakra-ui/core';
import { Provider, createClient } from 'urql';

//import theme from '../theme'
const client = createClient({
  url:'http://localhost:4000/graphql',
  fetchOptions:{
    credentials: "include" //send the cookie
  }
})

const MyApp = ({ Component, pageProps }) => {
  return (
  <Provider value = {client}>
		<ThemeProvider>
			<CSSReset />
			<Component {...pageProps} />
		</ThemeProvider>
  </Provider>
	);
};

export default MyApp;
