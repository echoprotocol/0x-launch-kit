export type Network = 'devnet';

export interface BuildOptions {
  tokenType: 'ERC20' | 'ERC721';
  network: Network;
  wsUrl: string;
  relayerUrl: string;
  feeRecipient: string;
  theme: 'light' | 'dark';
  port: number;
  makerFee: number;
  takerFee: number;
  collectibleAddress: string;
  collectibleName: string;
  collectibleDescription: string;
}

function getNetworkId(network: Network): number {
  switch (network) {
    case 'devnet':
      return 4;
    default:
      return 50;
  }
}

export const buildDockerComposeYml = (options: BuildOptions) => {
  const basePath = options.tokenType === 'ERC20' ? '/erc20' : '/erc721';
  const theme = options.theme === 'light' ? 'LIGHT_THEME' : 'DARK_THEME';

  //@ts-ignore
  const isGanache = options.network === 'ganache';
  const collectiblesSource = isGanache ? 'mocked' : 'opensea';

  const networkId = getNetworkId(options.network);

  const ganacheService = `
  ganache:
    image: echoprotocol/ganache-cli
    ports:
      - "8545:8545"`;
  const collectibleEnv = `
      REACT_APP_COLLECTIBLES_SOURCE: '${collectiblesSource}'
      REACT_APP_COLLECTIBLE_ADDRESS: '${options.collectibleAddress}'
      REACT_APP_COLLECTIBLE_NAME: '${options.collectibleName}'
      REACT_APP_COLLECTIBLE_DESCRIPTION: '${options.collectibleDescription}'
    `.trimLeft();

  return `
version: "3"
services:${isGanache ? ganacheService : ''}
  frontend:
    image: echoprotocol/launch-kit-frontend
    environment:
      REACT_APP_RELAYER_URL: '${options.relayerUrl}'
      REACT_APP_DEFAULT_BASE_PATH: '${basePath}'
      REACT_APP_THEME_NAME: '${theme}'
      REACT_APP_NETWORK_ID: ${networkId}
      ${options.tokenType === 'ERC20' ? '' : collectibleEnv}
    command: yarn build
    volumes:
        - frontend-assets:/app/build
  backend:
    image: echoprotocol/launch-kit-backend
    environment:
        HTTP_PORT: '3000'
        RPC_URL: '${options.wsUrl}'
        NETWORK_ID: '${networkId}'
        WHITELIST_ALL_TOKENS: 'true'
        FEE_RECIPIENT: '${options.feeRecipient}'
        MAKER_FEE_ZRX_UNIT_AMOUNT: '${options.makerFee}'
        TAKER_FEE_ZRX_UNIT_AMOUNT: '${options.takerFee}'
    ports:
      - '3000:3000'
  nginx:
    image: nginx
    ports:
        - '${options.port}:80'
    volumes:
        - frontend-assets:/usr/share/nginx/html
volumes:
    frontend-assets:
`.trimLeft();
};
