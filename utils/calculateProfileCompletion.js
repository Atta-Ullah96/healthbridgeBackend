// utils/profileCompletion.js
export const calculateProfileCompletion = ({ basicInfo,

    professional,
    consultation,
    profileSummary,
    location,
    documents,
    availability
}) => {
    let percentage = 0;
    if (basicInfo?.isCompleted) percentage += 25;
    if (professional?.isCompleted) percentage += 20;
    if (profileSummary?.isCompleted) percentage += 15;
    if (documents?.isCompleted) percentage += 15;
    if (consultation?.isCompleted) percentage += 15;
    if (availability?.isCompleted) percentage += 15;
    if (location?.isCompleted) percentage += 10;

    return percentage;
};
