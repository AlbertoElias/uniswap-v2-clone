# Uniswap v2 Clone

This is a clone of the Uniswap v2 interface on Optimism. It uses the Uniswap v2 SDK to interact with the Uniswap v2 smart contracts. It supports swapping between ERC20 tokens or ETH and ERC20 tokens.

Currently, it only supports USDC and ETH on the Optimism network. You can add more tokens by adding them to the `tokens` array in `src/constants/tokens.ts` as explained below.

## Set Up

### Running the app

```bash
git clone 
npm install
npm run dev
```

### Optimism setup

1. Connect to the Optimism network on Metamask.
2. If not, the app will prompt you to switch to Optimism. Accept the prompt on Metamask.
3. Use the [Optimism bridge](https://app.optimism.io/bridge/deposit) to send over some ETH and/or USDC to the Optimism network.
4. Enjoy swapping in the app!

### Sepolia setup

The [Uniswap deployment](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments) on Sepolia doesn't work. Router02 throws an error with most calls so this is non-functional. I left the code in the repo for reference. It also serves as a reference on how to make this app multi-chain.

Below is an explanation on how to get Sepolia tokens for testing.

You'll need Sepolia USDC to use this app. You can use the [Circle Fauce](https://faucet.circle.com/) to get some. To get some ETH, use one of these [faucets](https://faucetlink.to/sepolia).

## Adding tokens

To add support for more tokens, you can add them to the `tokens` array in `src/constants/tokens.ts`. The structure is:

```js
{
  address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
  decimals: 18,
  symbol: "ETH",
  logo: "eth.png"
}
```

The `logo` field is the name of the image file in `public/images/`. You can add more images there.

## ToDo

- show value in fiat
- show uniswap info
