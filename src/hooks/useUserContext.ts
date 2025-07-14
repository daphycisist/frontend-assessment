import { Context, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { UserContextType } from "../types/transaction";

export const useUserContext = () => {
  return useContext<UserContextType>(UserContext as Context<UserContextType>);
};