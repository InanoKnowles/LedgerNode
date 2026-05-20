import { Contract, ContractRunner } from "ethers";
import addresses from "./contracts/addresses.json";
import ComplianceRegistry from "./contracts/ComplianceRegistry.json";
import PropertyRegistry from "./contracts/PropertyRegistry.json";
import MockUSDC from "./contracts/MockUSDC.json";
import FractionalExchange from "./contracts/FractionalExchange.json";
import ValuationOracle from "./contracts/ValuationOracle.json";

export const ADDRESSES = addresses.addresses;

export function getCompliance(runner: ContractRunner) {
  return new Contract(ADDRESSES.ComplianceRegistry, ComplianceRegistry.abi, runner);
}
export function getRegistry(runner: ContractRunner) {
  return new Contract(ADDRESSES.PropertyRegistry, PropertyRegistry.abi, runner);
}
export function getUSDC(runner: ContractRunner) {
  return new Contract(ADDRESSES.MockUSDC, MockUSDC.abi, runner);
}
export function getExchange(runner: ContractRunner) {
  return new Contract(ADDRESSES.FractionalExchange, FractionalExchange.abi, runner);
}
export function getOracle(runner: ContractRunner) {
  return new Contract(ADDRESSES.ValuationOracle, ValuationOracle.abi, runner);
}
