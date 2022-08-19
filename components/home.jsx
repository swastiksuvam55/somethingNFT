import React, { useState, useEffect } from "react";
import Game from "../pages/game";
import Mint from "./mint";
import { ethers } from "ethers";
import contractabi from "./abi.json";
import useAnalyticsEventTracker from "./useAnalyticsEventTracker";
import axios from "axios";
import constants from "./constants";
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

export default function HomePage() {
  const whiteList = [
    "0xa93d490ba7cfaa49cbc026d3bfacbfdc2d3e0551",
    "0x4b9bdc483e13f4cfb31bc5aec362460718747286",
    "0xf8e730cc0d8a30ca391cc6822f6dd64173199a73",
    "0x9c966518dbb886288afbb202a0824c570bac3731",
    "0xe99b128c4754e35cca1ac83a091d607f0df586f8",
    "0x5802440693876cfe6f7f6756774ad0b976a5d387",
  ];
  const futureDate = new Date(1660917600000);
  // const futureDate = new Date(1660889040000);
  // const whiteListDate = new Date(1660914000000);
  const whiteListDate = new Date(1660917600000);

  const [timeStamp, setTimeStamp] = useState(futureDate);
  const [wallets, setWallets] = useState("");
  const [currentMintCount, setCurrentMintCount] = useState(1);
  const [NFTCount, setNFTCount] = useState(1);
  const [walletAddress, setWalletAddress] = useState("");
  const [walltetAddressSmall, setWalltetAddressSmall] = useState("");
  const [userMints, setUserMints] = useState(null);
  // const [quantity, setQuantity] = useState(1);
  // const [chainId, setChainId] = useState(1);
  const [outOfShit, setOutofshit] = useState(false);

  // Google analytics constants
  const gaWalletTracker = useAnalyticsEventTracker("wallet");
  const gaMintTracker = useAnalyticsEventTracker("mint");
  const gaOtherTracker = useAnalyticsEventTracker("others");

  const changeNftCount = (count) => {
    if (count == "+") {
      if (NFTCount > 9) return;
      setNFTCount(NFTCount + 1);
    } else {
      if (NFTCount > 1) {
        setNFTCount(NFTCount - 1);
      }
    }
  };

  const leaves = constants.whiteList.map((x) => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const buf2hex = (x) => "0x" + x.toString("hex");

  const proof = tree
    .getProof(buf2hex(keccak256(walletAddress)))
    .map((x) => buf2hex(x.data));

  const leaf = buf2hex(keccak256(walletAddress));

  console.log("My leaf:", buf2hex(keccak256(walletAddress)));
  console.log(
    "Proof:",
    tree.getProof(buf2hex(keccak256(walletAddress))).map((x) => buf2hex(x.data))
  );
  console.log("Root Hash:", buf2hex(tree.getRoot()));
  //
  //
  // End of Contract Integration constants
  //
  //

  //
  //
  //
  // Contract Integration
  //
  //
  //
  //
  useEffect(() => {
    setTimeout(() => {
      if (
        window?.ethereum &&
        window?.ethereum?.selectedAddress &&
        wallets === ""
      ) {
        setWallets(window.ethereum.selectedAddress.slice(-4));
        setWalletAddress(window?.ethereum?.selectedAddress);
        setWalltetAddressSmall(
          window?.ethereum?.selectedAddress.toLocaleLowerCase()
        );
        checkWl(window?.ethereum?.selectedAddress.toLocaleLowerCase());
      }
    }, 1000);
    setTimeout(() => {
      mintCount();
    }, 2000);
  }, []);
  function createPost(walleteId) {
    axios
      .post("https://server.spotmies.com/api/suggestion/new-suggestion", {
        suggestionFor: "other",
        suggestionFrom: "others",
        subject: "whitelist_something",
        body: walleteId,
      })
      .then((response) => {
        // setPost(response.data);
        console.log(response);
      });
  }
  async function requestAccount(showError) {
    const alertMessage = showError ?? true;
    if (window.ethereum) {
      if (wallets !== "") {
        checkWl(walltetAddressSmall);
        if (alertMessage) alert("Wallet already connected");
        return;
      }
      gaWalletTracker("new-wallet");
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        mintCount();
        getChainId();
        // setWalletText(true);
        gaWalletTracker("wallet-connected");
        setWallets(accounts[0].slice(-4));
        console.log(accounts[0]);
        setWalletAddress(accounts[0]);
        setWalltetAddressSmall(accounts[0].toLocaleLowerCase());
        checkWl(accounts[0].toLocaleLowerCase());
        // console.log("account", accounts[0].toLocaleLowerCase());
        // createPost(accounts[0]);
      } catch (error) {
        // console.log("Error connecting....");
        alert(error);
      }
    } else {
      //console.log("Metamask not detected");
      gaWalletTracker("no-metamask");
      alert("Metamask not detected");
    }
  }
  function checkWl(walleteAddress) {
    let isWhiteList = false;
    constants.whiteList.forEach((item) => {
      if (item.toLowerCase() === walleteAddress) {
        isWhiteList = true;
      }
    });
    console.log("is whitelist", isWhiteList);
    if (isWhiteList) {
      setTimeStamp(whiteListDate);
    }
  }
  const getChainId = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window?.ethereum);
      const { chainId } = await provider.getNetwork();
      console.log("chainId", chainId);
      // setChainId(chainId);

      if (chainId !== 1) {
        alert("Please connect to Ethereum Mainnet");
      }
    } catch (error) {
      console.log("Error connecting....");
    }
  };

  const getContract = () => {
    try {
      const contractAddress = "";
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        contractabi,
        signer
      );
      // console.log("contract", contract);
      return contract;
    } catch (error) {
      console.log("error, getcontract", error);
    }
  };

  const isValid = async () => {
    const isValid = await getContract().MerkleVerify(proof, leaf);
    console.log("isValid?", isValid);
  };

  const mintCount = async () => {
    // const TotalMinted = await getContract().suppliedNFTs();

    if (!window.ethereum) {
      //alert("Metamask not detected");
      console.log("Metamask not detected");
      return null;
    }

    try {
      const TotalMinted = await getContract().totalSupply();
      const userMinted = await getContract().userMint();
      console.log("userMints:  ", userMinted);
      console.log("myMints", parseInt(userMinted._hex, 16));
      setUserMints(parseInt(userMinted._hex, 16));
      console.log("totalMinted", TotalMinted);
      console.log(parseInt(TotalMinted._hex, 16));
      try {
        let count = parseInt(TotalMinted._hex, 16);
        setCurrentMintCount(count);
        if (count >= 4969) {
          setOutofshit(true);
        }
      } catch (error) {
        setCurrentMintCount(2000);
      }
      return parseInt(userMinted._hex, 16);

      // setCurrentMintCount(3769);
    } catch (err) {
      console.log("mintcount error", err);
      return null;
    }
  };

  const mintToken = async (userMintArg) => {
    // const connection = contract.connect(signer);
    // const addr = connection.address;
    // const supply = await contract.suppliedNFTs();
    // setSupply(supply);
    try {
      if (NFTCount < 1) {
        alert("Please enter valid quantity");
        return;
      }
      let ethValue = NFTCount * 0.005;
      let isWhiteList = false;
      constants.whiteList.forEach((item) => {
        if (item.toLowerCase() === walltetAddressSmall.toLowerCase()) {
          isWhiteList = true;
        }
      });
      console.log("is whitelist", isWhiteList);
      if (isWhiteList) {
        console.log("whitelisted", walltetAddressSmall);
        if (userMintArg === null) {
          alert("Please connect to wallet");
          return;
        } else if (userMintArg == 0) {
          ethValue = NFTCount * 0.002 - ((1 - userMintArg) * 0.002).toFixed(3);
          if (ethValue < 0) {
            ethValue = 0;
          }
        } else {
          ethValue = (NFTCount * 0.002).toFixed(3);
        }
      } else {
        console.log("not whitelisted", walltetAddressSmall);
        if (userMintArg == 0) {
          ethValue = (NFTCount * 0.005 - (1 - userMintArg) * 0.005).toFixed(3);
        }
      }

      // if (currentMintCount + NFTCount > 1000) {
      //   var ethValue = NFTCount * 0.002;
      // } else {
      //   var ethValue = NFTCount * 0;
      // }
      // var ethValue = NFTCount * 0.002;
      console.log("final", NFTCount, ethValue);
      getContract()
        .mint(NFTCount, proof, leaf, {
          value: ethers.utils.parseEther(ethValue.toString()),
        })
        .then((val) => {
          alert("Token minted successfully");

          mintCount();
          // console.log("val", val);
          // console.log("error", error);
        })
        .catch((error) => {
          // console.log("error", error);
          // console.table(error);
          console.log(error.reason);
          alert(error.reason);
          // console.log("errortp", typeof error);
          // console.log("errorm", error.message);
        });
    } catch (error) {
      console.log("error91, mint button", error);
    }

    //console.log(result);
  };

  const clickedMint = async () => {
    requestAccount(false);
    getChainId();
    let userMints = await mintCount();
    console.log("userMints", userMints);
    if (userMints != null) {
      mintToken(userMints);
    }
  };

  //
  //
  //
  // End Of Contract Integration
  //
  //
  //
  //
  return (
    <div className="home-parent">
      <div className="home">
        <div className="dummy" />
        <div className="dummy" />
        {/* <p className="head">Something</p> */}
        <div className="icon-links">
          {/* <img src="/images/e1.png" /> */}
          {/* <img src="/images/open.png" /> */}
          <img
            src="/images/twit.png"
            onClick={() => {
              window.open("https://twitter.com/itssomethingNFT", "_blank");
            }}
          />
          <p
            className="connect-wallet pointer agency-font"
            onClick={requestAccount}
          >
            {wallets === "" ? "Connect wallet" : "0x..." + wallets}
          </p>
        </div>
      </div>
      {/* <button onClick={isValid}></button> */}
      <Mint
        clickedMint={clickedMint}
        changeCount={changeNftCount}
        mintCount={NFTCount}
        timeStamp={timeStamp}
      />
      <Game />
    </div>
  );
}
