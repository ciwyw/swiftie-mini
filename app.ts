interface UserProfile {
  avatarUrl: string;
  nickName: string;
}

interface IAppOption {
  globalData: {
    userProfile: UserProfile;
  };
}

App<IAppOption>({
  globalData: {
    userProfile: {
      avatarUrl: '/assets/images/ui/avatar-placeholder.png',
      nickName: 'Swiftie'
    }
  }
});
