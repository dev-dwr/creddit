import { CSSReset, theme, ThemeProvider } from '@chakra-ui/core';
import { withUrqlClient } from 'next-urql';
import {createUrqlClient} from '../utils/createUrqlClient';

const MyApp = ({ Component, pageProps }: any) => {
	return (
			<ThemeProvider theme = {theme}>
				<CSSReset />
				<Component {...pageProps} />
			</ThemeProvider>
	);
};

export default MyApp;
