import { Context, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { UserContextType } from "../types/transaction";

export const useUserContext = () => {
  return useContext<UserContextType>(UserContext as Context<UserContextType>);
  // if (!context) {
  //   throw new Error("useUserContext must be used within a UserProvider");
  // }
  // return context;
};