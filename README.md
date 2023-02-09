# IPFS Video to HLS at Aleph.IM

With this program you can transcode any MP4 video to HLS protocol using IPFS and Aleph.IM Network.

### Requirements

You will need a working IPFS server already installed. You can install it following [this guide](https://docs.ipfs.tech/install/ipfs-desktop/).

### Installation

Install project dependencies:

```
npm install
```

### Configuration

Copy the example `.env` file:

````
cp -vap .env.example .env
````

Fill the needed variables with you own setup:

````
IPFS_API_HOST=http://localhost:5001
IPFS_GATEWAY_HOST=https://ipfs.io
WALLET_PRIVATE_KEY=XXXXXXXXXXXXXXXXXXXX
````

### Usage

Only substitute the `example.mp4` file with your MP4 video and execute the command

```
npm run start example.mp4
```

This will convert the MP4 video to HLS format, upload it to IPFS and pin it to Aleph.IM Network.

After that you will be able to see you video in every HLS player, like [this one](https://ipfs.io/ipfs/QmRYGfcCaNq8fDw8dgjcbT9P6gDZQRyVwn3M732AvHaCRV).
