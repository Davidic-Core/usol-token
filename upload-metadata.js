const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const { keypairIdentity, createGenericFile } = require("@metaplex-foundation/umi");
const { irysUploader } = require("@metaplex-foundation/umi-uploader-irys/node");

async function main() {
  const keyPath = path.join(
    os.homedir(),
    ".config",
    "unitedsolana",
    "devnet-keypair.json"
  );

  const secret = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  const umi = createUmi("https://api.devnet.solana.com");

  const keypair = umi.eddsa.createKeypairFromSecretKey(
    new Uint8Array(secret)
  );

  umi.use(keypairIdentity(keypair));
  umi.use(irysUploader({
    address: "https://devnet.irys.xyz"
  }));

  const uploader = umi.uploader;

  const logoBuffer = fs.readFileSync("logo.png");
  const metadata = JSON.parse(fs.readFileSync("metadata.json", "utf8"));

  const logoFile = createGenericFile(
    logoBuffer,
    "logo.png",
    { contentType: "image/png" }
  );

  const estimatedBytes =
    2000 + Math.max(80000, logoBuffer.length) +
    2000 + Math.max(80000, Buffer.byteLength(JSON.stringify(metadata)));

  const price = await uploader.getUploadPriceFromBytes(estimatedBytes);
  const estimatedSol = Number(price.basisPoints) / 1_000_000_000;

  console.log("\nUnitedSolana metadata upload");
  console.log("Network: Irys Devnet");
  console.log("Wallet:", keypair.publicKey);
  console.log("Estimated cost:", estimatedSol, "SOL");
  console.log("Files: logo.png and metadata.json");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise(resolve => {
    rl.question("\nProceed with upload? Type YES to confirm: ", resolve);
  });

  rl.close();

  if (answer.trim() !== "YES") {
    console.log("Upload cancelled. No upload was made.");
    return;
  }

  console.log("\nUploading logo...");
  const [imageUri] = await uploader.upload([logoFile]);

  console.log("Logo uploaded:", imageUri);

  metadata.image = imageUri;
  metadata.properties.files[0].uri = imageUri;

  fs.writeFileSync(
    "metadata.json",
    JSON.stringify(metadata, null, 2) + "\n"
  );

  console.log("\nUploading metadata JSON...");
  const metadataUri = await uploader.uploadJson(metadata);

  console.log("\nUPLOAD SUCCESSFUL");
  console.log("Image URI:", imageUri);
  console.log("Metadata URI:", metadataUri);

  fs.writeFileSync("metadata-uri.txt", metadataUri + "\n");
  console.log("Metadata URI saved to metadata-uri.txt");
}

main().catch(error => {
  console.error("\nUpload failed:", error.message);
  process.exit(1);
});
