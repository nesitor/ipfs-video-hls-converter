/* eslint-disable no-console */
import { create as ipfsHttp } from 'ipfs-http-client'
import fs from 'fs'
import * as dotenv from 'dotenv'
import * as ffmpegInstall from '@ffmpeg-installer/ffmpeg'
const ffmpegPath = ffmpegInstall.path
import ffmpeg from 'fluent-ffmpeg'
import { ImportAccountFromPrivateKey } from 'aleph-sdk-ts/dist/accounts/ethereum.js'
import { Pin as pinStore } from 'aleph-sdk-ts/dist/messages/store/pin.js'

const outputPath = './output/'

dotenv.config()

await run()

async function run() {
    ffmpeg.setFfmpegPath(ffmpegPath)

    const args = process.argv

    if (args.length < 3) {
        console.log('Video file to process is required')
        return false
    }

    const file = process.argv[2]

    if (!fs.existsSync(file)) {
        console.log('Video file don\'t exists')
        return false
    }

    console.log('File: ', file)

    ffmpeg(file)
        .addOutputOption("-c:v", "copy", "-bsf:v", "h264_mp4toannexb", "-c:a", "aac", "-strict", "experimental", "-start_number", "0", "-hls_time", "1", "-hls_list_size", "6")
        .output(outputPath + 'v%v/master.m3u8')
        .on('end', async function() {
            const outputVideo = 'v0'
            const chunks = await uploadChunks(outputVideo)
            await mountHLS(outputVideo, chunks)
            const manifest = await uploadHLS(outputVideo)
            console.log('Chunks: ', chunks)
            console.log('Manifest: ', manifest)
        })
        .run()
}

async function mountHLS(video, chunks) {
    console.log('Chunks: ', chunks)
    const manifestPath = outputPath + video + '/master.m3u8'
    const gatewayURL = process.env.IPFS_GATEWAY_HOST + '/ipfs/'

    for (const chunk of chunks) {
        const data = fs.readFileSync(manifestPath, 'utf-8')
        const newValue = data.replace(chunk.name , gatewayURL + chunk.cid)
        fs.writeFileSync(manifestPath, newValue, 'utf-8')
    }
}

async function uploadHLS(video) {
    const ipfs = ipfsHttp(process.env.IPFS_API_HOST)
    const manifestPath = outputPath + video + '/master.m3u8'
    const buffer = fs.readFileSync(manifestPath)

    const response = await ipfs.add(buffer, {pin: true})
    const cid = response.path

    const message = await pinToAlephNetwork(cid)

    return {
        name: 'master.m3u8',
        cid,
        message
    }
}

async function uploadChunks(video) {
    const ipfs = ipfsHttp(process.env.IPFS_API_HOST)
    const chunksPath = outputPath + video
    const files = fs.readdirSync(chunksPath)
    console.log('Files: ', files)

    const chunks = []

    for (const file of files) {
        if (file.includes('.m3u8')) {
            continue
        }

        const buffer = fs.readFileSync(chunksPath + '/' + file)
        const response = await ipfs.add(buffer, {pin: true})
        const cid = response.path

        const message = await pinToAlephNetwork(cid)

        const chunk = {
            name: file,
            cid,
            message: message
        }

        chunks.push(chunk)
    }

    return chunks
}

async function pinToAlephNetwork(ipfsCid) {
    const account = await ImportAccountFromPrivateKey(process.env.WALLET_PRIVATE_KEY)

    return await pinStore({
        account: account,
        channel: 'TEST',
        fileHash: ipfsCid,
    })
}

