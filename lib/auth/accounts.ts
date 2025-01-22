import { UserAccount } from "./definitions";

export const accounts: UserAccount[] = [
  { id: 1, name: "Myrna Van Wagoner", avatar: undefined },
  { id: 2, name: "Gerret Van Wagoner", avatar: undefined },
  { id: 3, name: "Elise Gardner", avatar: undefined },
  { id: 4, name: "Matt Gardner", avatar: undefined },
  { id: 5, name: "Ashley Maxwell", avatar: undefined },
  { id: 6, name: "Jordan Maxwell", avatar: undefined },
  { id: 7, name: "Kayla Van Wagoner", avatar: undefined },
  { id: 8, name: "Logan Van Wagoner", avatar: undefined },
  { id: 9, name: "Landon Van Wagoner", avatar: undefined },
  { id: 10, name: "Brennah Van Wagoner", avatar: undefined },
  { id: 11, name: "Savanah Van Wagoner", avatar: undefined },
]

export function fetchUsersAsMap() {
  return accounts.reduce((acc, user) => {
    acc.set(user.id, user)
    return acc;
  }, new Map() as Map<number, UserAccount>);
}

export function fetchAccountById(userId: number) {
  return accounts.find(user => user.id == userId)
}
