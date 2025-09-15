// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SimpleNFT
 * @dev ERC721 NFT contract with metadata support and supply management
 */
contract SimpleNFT is ERC721, IERC4906, Ownable {
    using Strings for uint256;

    mapping(uint256 tokenId => string) private _tokenURIs;
    uint256 private _nextTokenId;
    uint256 private _maxSupply;
    bytes4 private constant ERC4906_INTERFACE_ID = bytes4(0x49064906);

    /**
     * @dev Initialize NFT contract
     * @param name_ NFT collection name
     * @param symbol_ NFT collection symbol
     * @param maxSupply_ Maximum supply
     */
    constructor(string memory name_, string memory symbol_, uint256 maxSupply_) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(maxSupply_ > 0, "Max supply must be greater than 0");
        _maxSupply = maxSupply_;
    }

    /**
     * @dev Check if contract supports specified interface
     * @param interfaceId Interface identifier
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, IERC165) returns (bool) {
        return interfaceId == ERC4906_INTERFACE_ID || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get metadata URI for specified token
     * @param tokenId Token ID
     * @return Complete metadata URI string
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        if (bytes(_tokenURI).length > 0) {
            return string.concat(base, _tokenURI);
        }

        return super.tokenURI(tokenId);
    }

    /**
     * @dev Set metadata URI for token (internal function)
     * @param tokenId Token ID
     * @param _tokenURI Metadata URI
     */
    function _setTokenURI(uint256 tokenId, string calldata _tokenURI) internal virtual {
        _tokenURIs[tokenId] = _tokenURI;
        emit MetadataUpdate(tokenId);
    }

    /**
     * @dev Mint new NFT (only contract owner can call)
     * @param to Address to receive the NFT
     * @param uri Metadata URI for the NFT
     * @return Newly minted token ID
     */
    function mintNFT(address to, string calldata uri) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        require(_nextTokenId < _maxSupply, "Maximum supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Get maximum supply
     * @return Maximum supply
     */
    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev Get current minted supply
     * @return Current supply
     */
    function currentSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Get remaining mintable supply
     * @return Remaining supply
     */
    function remainingSupply() public view returns (uint256) {
        return _maxSupply - _nextTokenId;
    }
}