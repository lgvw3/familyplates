import { UserAccount } from "./definitions";

export const accounts: UserAccount[] = [
  { id: 1, name: "Myrna Van Wagoner" },
  { id: 2, name: "Gerret Van Wagoner" },
  { id: 3, name: "Elise Gardner" },
  { id: 4, name: "Matt Gardner" },
  { id: 5, name: "Ashley Maxwell" },
  { id: 6, name: "Jordan Maxwell" },
  { id: 7, name: "Kayla Van Wagoner" },
  { id: 8, name: "Logan Van Wagoner" },
  { id: 9, name: "Landon Van Wagoner" },
  { id: 10, name: "Brennah Van Wagoner" },
  { id: 11, name: "Savanah Van Wagoner" },
]

export function fetchUsersAsMap(users: UserAccount[] = accounts) {
  return users.reduce((acc, user) => {
    acc.set(user.id, user)
    return acc;
  }, new Map() as Map<number, UserAccount>);
}

export function fetchAccountById(userId: number) {
  return accounts.find(user => user.id == userId)
}
