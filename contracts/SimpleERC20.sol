// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract SimpleERC20 is IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;
    uint256 private _totalSupply;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    address private _owner;
    
    /**
     * @dev Sets the values for {name}, {symbol}, {decimals} and initializes the token supply.
     *
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param decimals_ The number of decimals for the token (typically 18)
     * @param initialSupply The initial supply of tokens (will be multiplied by 10^decimals)
     *
     * The initial supply is minted to the contract deployer and a Transfer event is emitted.
     * All values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_, uint8 decimals_, uint256 initialSupply) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _owner = msg.sender;
        uint256 multiplier = 10**_decimals;
        _totalSupply = initialSupply * multiplier;
        _balances[_owner] = initialSupply * multiplier;
        emit Transfer(address(0), _owner, _totalSupply);
    }
    
    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the decimals places of the token.
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() public view returns (uint8) {
        return _decimals;
    }
    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) public returns (bool) {
        address owner = msg.sender;
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        uint256 fromBalance = _balances[owner];
        if (fromBalance < value) {
            revert ERC20InsufficientBalance(owner, fromBalance, value);
        }
        _balances[owner] = fromBalance - value;
        _balances[to] += value;
        emit Transfer(owner, to, value);
        return true;
    }
    
    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) public returns (bool) {
        address owner = msg.sender;
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        address spender = msg.sender;
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        uint256 currentAllowance = allowance(from, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            _allowances[from][spender] = currentAllowance - value;
        }
        uint256 fromBalance = _balances[from];            
        if (fromBalance < value) {
            revert ERC20InsufficientBalance(from, fromBalance, value);
        }
        _balances[from] = fromBalance - value;
        _balances[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     * 
     * This modifier ensures that only the contract owner can execute certain functions.
     * It checks if the caller (msg.sender) is the same as the stored _owner address.
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "Not the owner");
        _;
    }

    /**
     * @dev Creates `value` amount of tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * @param account The address to receive the newly minted tokens
     * @param value The amount of tokens to mint
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     * - Only the contract owner can call this function
     * - `account` cannot be the zero address
     */
    function mint(address account, uint256 value) public onlyOwner{
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _totalSupply += value;
        _balances[account] += value;
        emit Transfer(address(0), account, value);
    }
}